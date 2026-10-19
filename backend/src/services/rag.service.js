
import { pipeline } from "@xenova/transformers";
import Knowledge from "../models/knowledge.model.js";

// Embedding model configuration
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const EXPECTED_EMBEDDING_DIMENSIONS = 384;

// Retrieval configuration
const VECTOR_INDEX_NAME = "vector_index";
const NUM_CANDIDATES = 20;
const DEFAULT_RESULT_LIMIT = 3;
const MIN_SIMILARITY_SCORE = 0.55;

// Only allow categories supported by this application.
const ALLOWED_CATEGORIES = new Set(["portfolio_data"]);

// Cache the model so it is loaded only once.
let embedderPromise = null;

const getEmbedder = async () => {
  if (!embedderPromise) {
    console.log("Loading embedding model...");

    embedderPromise = pipeline(
      "feature-extraction",
      EMBEDDING_MODEL
    ).catch((error) => {
      
      embedderPromise = null;

      console.error("Embedding model loading failed:", error.message);
      throw error;
    });
  }

  return embedderPromise;
};

// Convert text into a normalized 384-dimensional vector.
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

// Retrieve relevant chunks and preserve their metadata and scores.
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

  // Search for semantically similar chunks in MongoDB Atlas.
  const results = await Knowledge.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: NUM_CANDIDATES,
        limit: DEFAULT_RESULT_LIMIT,
        filter: {
          "metadata.category": {
            $eq: categoryFilter,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        metadata: 1,
        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  // Filter results and return useful information for each chunk.
  return results
    .filter((item) => item.score > MIN_SIMILARITY_SCORE)
    .map((item) => ({
      content: item.content,
      source: item.metadata?.source ?? null,
      category: item.metadata?.category ?? null,
      chunkIndex: item.metadata?.chunkIndex ?? null,
      score: item.score,
    }));
};
