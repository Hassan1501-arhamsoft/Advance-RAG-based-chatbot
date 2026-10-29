import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Knowledge from "../models/knowledge.model.js";
import { generateEmbedding } from "../services/rag.service.js";
import { cleanText } from "./cleanText.js";
import semantic from "@johnhenry/semantic-chunker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TXT_FILE = path.resolve(__dirname, "../data/personal_data.txt");

async function seedKnowledge() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from your .env file");
    }
    await mongoose.connect(process.env.MONGO_URI);

    const rawText = await fs.readFile(TXT_FILE, "utf8");
    const text = cleanText(rawText);

    if (!text.trim()) {
      throw new Error("The TXT file is empty or no usable text found after cleaning");
    }

    console.log("Generating semantic chunks using @johnhenry/semantic-chunker...");

    // Initialize chunker utilizing your existing project embedder
    const chunker = semantic({
      embed: generateEmbedding,
      zScoreThreshold: 1.0, // Controls sensitivity (higher = larger chunks, lower = smaller chunks)
      maxChunkSize: 1000,
      overlap: 1,
    });

    const documents = [];
    let chunkIndex = 0;

    // Iterate over async generator yielding [chunkText, embedding] pairs
    for await (const [chunkContent, embedding] of chunker(text)) {
      if (!chunkContent || !chunkContent.trim()) continue;

      if (embedding.length !== 384) {
        throw new Error(`Unexpected embedding dimensions: ${embedding.length}`);
      }

      documents.push({
        content: chunkContent,
        embedding,
        metadata: {
          source: path.basename(TXT_FILE),
          category: "portfolio_data",
          chunkIndex,
        },
      });
      chunkIndex++;
    }

    // Attach total chunk count metadata
    documents.forEach((doc) => {
      doc.metadata.totalChunks = documents.length;
    });

    await Knowledge.deleteMany({ "metadata.category": "portfolio_data" });
    await Knowledge.insertMany(documents);

    console.log(`Successfully seeded ${documents.length} semantic chunks into MongoDB.`);
  } catch (error) {
    console.error("Knowledge seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedKnowledge();