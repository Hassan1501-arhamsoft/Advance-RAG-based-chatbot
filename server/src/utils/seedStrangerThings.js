import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Knowledge from "../models/knowledge.model.js";
import { generateEmbedding } from "../services/rag.service.js";
import semantic from "@johnhenry/semantic-chunker";
import { cleanText } from "./cleanText.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TXT_FILE = path.resolve(__dirname, "../data/stranger_things.txt"); // Ensure your file is placed here

async function seedStrangerThings() {
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

    console.log("Generating semantic chunks for Stranger Things...");
    const chunker = semantic({
          embed: generateEmbedding,
          zScoreThreshold: 1.0, // Controls sensitivity (higher = larger chunks, lower = smaller chunks)
          maxChunkSize: 450,
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
              category: "stranger_things",
              chunkIndex,
            },
          });
          chunkIndex++;
        }
    
        // Attach total chunk count metadata
        documents.forEach((doc) => {
          doc.metadata.totalChunks = documents.length;
        });

    // Optional: If you want to keep portfolio data, don't deleteMany entirely, or remove only stranger_things
    await Knowledge.deleteMany({ "metadata.category": "stranger_things" });
    await Knowledge.insertMany(documents);

    console.log(`Successfully seeded ${documents.length} Stranger Things chunks.`);
  } catch (error) {
    console.error("Stranger Things seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedStrangerThings();