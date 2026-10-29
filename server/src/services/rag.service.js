import { pipeline, AutoTokenizer, AutoModelForSequenceClassification } from "@xenova/transformers";
import Knowledge from "../models/knowledge.model.js";
import { reciprocalRankFusion } from "../utils/rrf.js";

// Embedding & Re-ranking Model Configurations
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const RERANKER_MODEL = "Xenova/ms-marco-MiniLM-L-6-v2";
const EXPECTED_EMBEDDING_DIMENSIONS = 384;

// Retrieval Configurations
const VECTOR_INDEX_NAME = "vector_index";
const TEXT_INDEX_NAME = "text_index";
const NUM_CANDIDATES = 20;
const FINAL_RESULT_LIMIT = 3;

const ALLOWED_CATEGORIES = new Set(["portfolio_data", "stranger_things"]);

let embedderPromise = null;
let rerankerTokenizerPromise = null;
let rerankerModelPromise = null;

const getEmbedder = async () => {
  if (!embedderPromise) {
    embedderPromise = pipeline("feature-extraction", EMBEDDING_MODEL).catch((error) => {
      embedderPromise = null;
      throw error;
    });
  }
  return embedderPromise;
};

const getReranker = async () => {
  if (!rerankerTokenizerPromise || !rerankerModelPromise) {
    rerankerTokenizerPromise = AutoTokenizer
      .from_pretrained(RERANKER_MODEL);

    rerankerModelPromise = AutoModelForSequenceClassification
      .from_pretrained(RERANKER_MODEL, { dtype: "q8" });

    try {
      const [tokenizer, model] = await Promise.all([
        rerankerTokenizerPromise,
        rerankerModelPromise,
      ]);

      return { tokenizer, model };
    } catch (error) {
      rerankerTokenizerPromise = null;
      rerankerModelPromise = null;
      throw error;
    }
  }

  return {
    tokenizer: await rerankerTokenizerPromise,
    model: await rerankerModelPromise,
  };
};

export const generateEmbedding = async (text) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Embedding input must be a non-empty string.");
  }

  const embedder = await getEmbedder();
  const output = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  const embedding = Array.from(output.data);

  if (embedding.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EXPECTED_EMBEDDING_DIMENSIONS} embedding dimensions, ` +
      `but received ${embedding.length}.`
    );
  }

  return embedding;
};

/**
  Advanced Retrieval Pipeline: Hybrid Search + RRF + Cross-Encoder Re-ranking
 */
export const retrieveRelevantContext = async (
  queryText,
  categoryFilter = "portfolio_data"
) => {
  if (typeof queryText !== "string" || !queryText.trim()) {
    throw new Error("The retrieval query must be a non-empty string.");
  }

  if (!ALLOWED_CATEGORIES.has(categoryFilter)) {
    throw new Error("Invalid knowledge category.");
  }

  const queryVector = await generateEmbedding(queryText);

  // 1. Run Vector Search and Text Search in parallel
  const [vectorResults, textResults] = await Promise.all([
    Knowledge.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates: NUM_CANDIDATES,
          filter: {
            "metadata.category": {
              $eq: categoryFilter,
            },
          },
          limit: NUM_CANDIDATES,
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          metadata: 1,
        },
      },
    ]),
    Knowledge.aggregate([
      {
        $search: {
          index: TEXT_INDEX_NAME,
          text: {
            query: queryText,
            path: "content",
          },
        },
      },
      {
        $match: { "metadata.category": categoryFilter },
      },
      { $limit: NUM_CANDIDATES },
      {
        $project: {
          _id: 1,
          content: 1,
          metadata: 1,
        },
      },
    ]),
  ]);

  // 2. Combine rankings using RRF utility
  const fusedCandidates = reciprocalRankFusion(vectorResults, textResults);

  if (fusedCandidates.length === 0) {
    return [];
  }

  const topCandidatesForRerank = fusedCandidates.slice(0, 10);

  // 3. Cross-Encoder Re-ranking
  try {
    const { tokenizer, model } = await getReranker();
    const queries = new Array(topCandidatesForRerank.length).fill(queryText);
    const passages = topCandidatesForRerank.map((doc) => doc.content);

    const inputs = tokenizer(queries, {
      text_pair: passages,
      padding: true,
      truncation: true,
      max_length: 512,
    });

    const outputs = await model(inputs);
    const logits = outputs.logits.data;
    const numLabels = outputs.logits.dims[1] ?? 1;
    topCandidatesForRerank.forEach((doc, idx) => {
      const score = numLabels === 1 ? logits[idx] : logits[idx * numLabels + 1];
      doc.relevanceScore = Number(score);
    });

    topCandidatesForRerank.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (rerankError) {
    console.warn("Re-ranking fallback to RRF order due to error:", rerankError.message);
  }

  // 4. Return top formatted results
  return topCandidatesForRerank.slice(0, FINAL_RESULT_LIMIT).map((item) => ({
    content: item.content,
    source: item.metadata?.source ?? null,
    category: item.metadata?.category ?? null,
    chunkIndex: item.metadata?.chunkIndex ?? null,
    score: item.relevanceScore ?? item.rrfScore,
  }));
};