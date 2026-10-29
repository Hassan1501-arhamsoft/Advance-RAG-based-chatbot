import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { retrieveRelevantContext } from "../services/rag.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_SUITE_PATH = path.resolve(__dirname, "../data/test_suite.json");
const OUTPUT_PATH = path.resolve(__dirname, "../data/evaluation_results.json");

// Centralized Gemini API Configuration
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Universal Gemini fetcher with auto-retry for rate limits (429/503).
 */
async function callGeminiAPI(prompt, isJsonMode = false, maxRetries = 3) {
  const config = { temperature: isJsonMode ? 0.0 : 0.1 };
  if (isJsonMode) config.responseMimeType = "application/json";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: config,
        }),
      });

      const data = await response.json();

      if (data.error) {
        if ([429, 503].includes(data.error.code) && attempt < maxRetries) {
          console.log(`\n[API Overloaded] Retrying attempt ${attempt}/${maxRetries} in 6s...`);
          await delay(6000);
          continue;
        }
        throw new Error(data.error.message);
      }

      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`\n[Network Error] Retrying attempt ${attempt}/${maxRetries} in 6s...`);
      await delay(6000);
    }
  }
}

/**
 * Generates the chatbot answer.
 */
async function generateAnswer(query, context) {
  const prompt = `Context:\n${context}\n\nQuestion: ${query}\nAnswer strictly based on the context.`;
  try {
    const text = await callGeminiAPI(prompt, false);
    return text || "Error generating response.";
  } catch (err) {
    console.error(`\n[Generation Error]: ${err.message}`);
    return "Generation Error.";
  }
}

/**
 * Evaluates the response accuracy and faithfulness.
 */
async function evaluateRun(query, expected, generated, context) {
  const evalPrompt = `
  You are an expert AI evaluator. Grade the RAG pipeline's response based on the following:
  Query: "${query}"
  Expected Answer: "${expected}"
  Provided Context: "${context}"
  Generated Answer: "${generated}"
  
  Evaluate on two metrics (Score 0.0 to 1.0):
  1. context_recall: Does the 'Provided Context' contain the information needed to answer the query?
  2. faithfulness: Is the 'Generated Answer' derived strictly from the 'Provided Context' without hallucinating outside information?

  Respond ONLY with a valid JSON object matching this schema:
  {"context_recall": 1.0, "faithfulness": 1.0, "reasoning": "brief explanation"}`;

  try {
    const content = await callGeminiAPI(evalPrompt, true);
    if (!content) throw new Error("Empty response from Judge");
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch (err) {
    console.error(`\n[Judge Error]: ${err.message}`);
    return { context_recall: 0, faithfulness: 0, reasoning: err.message };
  }
}

/**
 * Main evaluation loop.
 */
async function runEvaluation() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing from environment variables.");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Evaluation...");

    const testData = JSON.parse(await fs.readFile(TEST_SUITE_PATH, "utf8"));
    const results = [];
    let totalRecall = 0;
    let totalFaithfulness = 0;

    for (const [index, test] of testData.entries()) {
      console.log(`\nEvaluating [${index + 1}/${testData.length}]: ${test.query}`);
      const startTime = performance.now();
      
      // 1. Retrieval
      const retrievedDocs = await retrieveRelevantContext(test.query, "portfolio_data");
      const contextString = retrievedDocs.map(d => d.content).join("\n\n");
      const retrievalLatency = Math.round(performance.now() - startTime);

      // 2. Generation & Evaluation
      const generatedAnswer = await generateAnswer(test.query, contextString);
      const scores = await evaluateRun(test.query, test.expected_answer, generatedAnswer, contextString);
      
      totalRecall += scores.context_recall;
      totalFaithfulness += scores.faithfulness;

      results.push({
        id: test.id,
        query: test.query,
        latency_ms: retrievalLatency,
        chunks_retrieved: retrievedDocs.length,
        scores,
        generated_answer: generatedAnswer,
      });

      console.log(`Recall: ${scores.context_recall} | Faithfulness: ${scores.faithfulness} | Latency: ${retrievalLatency}ms`);

      // Free tier rate limit protection
      if (index < testData.length - 1) await delay(4500);
    }

    const summary = {
      average_recall: `${(totalRecall / testData.length)*100}%`,
      average_faithfulness: `${(totalFaithfulness / testData.length)*100}%`,
      details: results
    };

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(summary, null, 2));
    console.log(`\nEvaluation Complete. Report saved to ${OUTPUT_PATH}`);
    console.log(`Average Recall: ${summary.average_recall}`);
    console.log(`Average Faithfulness: ${summary.average_faithfulness}`);

  } catch (error) {
    console.error("Evaluation Failed:", error.message);
  } finally {
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
  }
}

runEvaluation();