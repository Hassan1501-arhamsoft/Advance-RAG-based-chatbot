//^=======================
//^ SeedRAG.jsx
//^=======================


import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Knowledge from "../models/knowledge.model.js";
import { generateEmbedding } from "../services/rag.service.js";
import { cleanText } from "./cleanText.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TXT_FILE = path.resolve(__dirname, "../data/personal_data.txt");

/**
 * Computes cosine similarity between two embedding vectors.
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Advanced Semantic Chunking: Splits text into paragraphs/sentences and 
 * groups them based on semantic similarity drop-off.
 */
async function semanticChunkText(rawText) {
  // Split into granular sentences or lines
  const rawSentences = rawText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSentences.length === 0) return [];

  const chunks = [];
  let currentChunkSentences = [rawSentences[0]];
  
  // Compute embeddings for sentences to evaluate semantic drift
  for (let i = 1; i < rawSentences.length; i++) {
    const prevSentence = rawSentences[i - 1];
    const currSentence = rawSentences[i];

    // Generate embeddings for adjacent sentences to check semantic distance
    const [embedPrev, embedCurr] = await Promise.all([
      generateEmbedding(prevSentence),
      generateEmbedding(currSentence),
    ]);

    const similarity = cosineSimilarity(embedPrev, embedCurr);

    // Threshold for semantic break (adjust between 0.55 - 0.75 as needed)
    const SIMILARITY_THRESHOLD = 0.65;
    const MAX_CHUNK_LENGTH = 600; // character safety ceiling

    const currentLength = currentChunkSentences.join(" ").length;

    if (similarity < SIMILARITY_THRESHOLD || currentLength >= MAX_CHUNK_LENGTH) {
      chunks.push(currentChunkSentences.join(" "));
      currentChunkSentences = [currSentence];
    } else {
      currentChunkSentences.push(currSentence);
    }
  }

  if (currentChunkSentences.length > 0) {
    chunks.push(currentChunkSentences.join(" "));
  }

  return chunks;
}

async function seedKnowledge() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from your .env file");
    }
    await mongoose.connect(process.env.MONGO_URI);

    const rawText = await fs.readFile(TXT_FILE, "utf8");
    const cleanedText = cleanText(rawText);

    if (!cleanedText.trim()) {
      throw new Error("No usable text found after cleaning");
    }

    console.log("Generating semantic chunks...");
    const splitTexts = await semanticChunkText(cleanedText);
    console.log(`Semantic chunking complete. Total chunks created: ${splitTexts.length}`);

    const documents = [];

    for (let i = 0; i < splitTexts.length; i++) {
      const content = splitTexts[i];
      const embedding = await generateEmbedding(content);

      if (embedding.length !== 384) {
        throw new Error(`Unexpected embedding dimensions: ${embedding.length}`);
      }

      documents.push({
        content,
        embedding,
        metadata: {
          source: path.basename(TXT_FILE),
          category: "portfolio_data",
          chunkIndex: i,
          totalChunks: splitTexts.length,
        },
      });
    }

    await Knowledge.deleteMany({});
    await Knowledge.insertMany(documents);

    console.log(`Successfully seeded ${documents.length} semantically chunked documents.`);
  } catch (error) {
    console.error("Knowledge seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedKnowledge();



//^=======================
//^ rag.service.js
//^=======================


import { pipeline } from "@xenova/transformers";
import Knowledge from "../models/knowledge.model.js";

// Embedding & Re-ranking Model Configurations
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const RERANKER_MODEL = "Xenova/ms-marco-MiniLM-L-6-v2";
const EXPECTED_EMBEDDING_DIMENSIONS = 384;

// Retrieval Configurations
const VECTOR_INDEX_NAME = "vector_index";
const TEXT_INDEX_NAME = "text_index"; // Required: Create text index on 'content' in MongoDB Atlas
const NUM_CANDIDATES = 20;
const FINAL_RESULT_LIMIT = 3;

const ALLOWED_CATEGORIES = new Set(["portfolio_data"]);

let embedderPromise = null;
let rerankerPromise = null;

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
  if (!rerankerPromise) {
    // Cross-encoder for re-ranking context relevance
    rerankerPromise = pipeline("text-classification", RERANKER_MODEL).catch((error) => {
      rerankerPromise = null;
      throw error;
    });
  }
  return rerankerPromise;
};

export const generateEmbedding = async (text) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Embedding input must be a non-empty string.");
  }
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  const embedding = Array.from(output.data);

  if (embedding.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EXPECTED_EMBEDDING_DIMENSIONS} dimensions, received ${embedding.length}`);
  }
  return embedding;
};

/**
 * Reciprocal Rank Fusion (RRF) to merge vector and keyword search rankings.
 */
function reciprocalRankFusion(vectorResults, textResults, k = 60) {
  const rrfScores = new Map();
  const docMap = new Map();

  // Score vector search results
  vectorResults.forEach((doc, rank) => {
    const id = doc._id.toString();
    docMap.set(id, doc);
    const score = 1 / (k + rank + 1);
    rrfScores.set(id, (rrfScores.get(id) || 0) + score);
  });

  // Score text search results
  textResults.forEach((doc, rank) => {
    const id = doc._id.toString();
    if (!docMap.has(id)) docMap.set(id, doc);
    const score = 1 / (k + rank + 1);
    rrfScores.set(id, (rrfScores.get(id) || 0) + score);
  });

  // Sort combined candidates by RRF score descending
  return Array.from(rrfScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      ...docMap.get(id),
      rrfScore: score,
    }));
}

/**
 * Advanced Retrieval Pipeline: Hybrid Search + RRF + Cross-Encoder Re-ranking
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

  // 1. Execute Vector Search and Text Search in parallel
  const [vectorResults, textResults] = await Promise.all([
    Knowledge.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates: NUM_CANDIDATES,
          limit: NUM_CANDIDATES,
          filter: { "metadata.category": { $eq: categoryFilter } },
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          metadata: 1,
          vectorScore: { $meta: "vectorSearchScore" },
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
      { $limit: NUM_CANDIDATES },
      {
        $match: { "metadata.category": categoryFilter },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          metadata: 1,
        },
      },
    ]),
  ]);

  // 2. Combine results using Reciprocal Rank Fusion (RRF)
  const fusedCandidates = reciprocalRankFusion(vectorResults, textResults);

  if (fusedCandidates.length === 0) {
    return [];
  }

  // Take top candidates for cross-encoder re-ranking
  const topCandidatesForRerank = fusedCandidates.slice(0, 10);

  // 3. Re-rank using Cross-Encoder model
  try {
    const reranker = await getReranker();
    const pairs = topCandidatesForRerank.map((doc) => [queryText, doc.content]);
    
    // Batch score pairs
    const scores = await reranker(pairs);

    topCandidatesForRerank.forEach((doc, idx) => {
      // Cross-encoder score output format handling
      const scoreObj = scores[idx];
      doc.relevanceScore = typeof scoreObj === "object" ? (scoreObj.score ?? scoreObj[0]?.score ?? 0) : scoreObj;
    });

    // Sort by cross-encoder relevance score descending
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