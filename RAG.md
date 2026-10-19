## Learning Roadmap

## Phase 1: RAG Fundamentals

Explain:

What RAG is and why it is needed.

How RAG works internally, from user query to final answer.

The difference between RAG, fine-tuning, and long-context prompting.

RAG architecture and its main components.

When RAG is useful and when it is unnecessary.

## Phase 2: Document Ingestion Pipeline

Teach me how production systems process different document types:

PDF, DOCX, TXT, CSV, HTML, and other supported formats.

Text extraction using suitable libraries.

Removing headers, footers, duplicate text, irrelevant content, and extraction noise.

Handling tables, metadata, page numbers, and document structure.

Detecting scanned PDFs and using OCR when necessary.

Validating, normalizing, and cleaning extracted text.

Handling extraction failures and unsupported files.

Explain which libraries are appropriate for each task and why.

## Phase 3: Chunking Strategies

Teach me:

Fixed-size chunking.

Recursive character chunking.

Token-based chunking.

Semantic chunking.

Structure-aware chunking.

Parent-child chunking.

Chunk overlap and how to choose an appropriate overlap.

How chunk size affects retrieval quality, latency, and token usage.

How to preserve paragraphs, headings, tables, and code blocks.

Show how to implement chunking in JavaScript and explain how to select a strategy for different document types.

## Phase 4: Metadata and Document Management

Explain:

What metadata is and why it matters.

Useful metadata fields such as document ID, filename, page number, section title, source, tenant ID, and upload date.

How to attach metadata to every chunk.

How to maintain relationships between documents, chunks, and their original sources.

How to implement document versioning, updates, deletion, and re-indexing.

How to prevent duplicate ingestion.

How to track ingestion status and failures.

Provide practical MongoDB schemas and indexing strategies.

## Phase 5: Embeddings and Vector Databases

Teach me:

What embeddings are and how they represent meaning.

How embedding models work at a conceptual level.

Similarity metrics: cosine similarity, dot product, and Euclidean distance.

How to select an embedding model.

Vector dimensions, token limits, and embedding costs.

Vector storage and indexing.

MongoDB Atlas Vector Search versus dedicated vector databases.

Vector index configuration and metadata filtering.

Embedding model changes and the need to re-embed documents.

Implement document embeddings and storage using JavaScript.

## Phase 6: Retrieval Pipeline

Explain and implement:

Query embedding generation.

Top-K similarity search.

Similarity thresholds.

Metadata filtering.

Hybrid search combining vector search and keyword/BM25 search.

Query rewriting and query expansion.

Multi-query retrieval.

Maximum marginal relevance (MMR).

Reranking retrieved chunks.

Context selection and token-budget management.

Explain when each technique improves results, its trade-offs, and when not to use it.

## Phase 7: Context Construction and Answer Generation

Teach me:

How to construct a high-quality context from retrieved chunks.

How to remove duplicate or irrelevant retrieved content.

How to order context and manage token budgets.

How to build system prompts for grounded answers.

How to instruct the LLM to acknowledge missing information.

How to generate answers with source citations.

How to distinguish retrieved evidence from model-generated assumptions.

How to prevent the model from following malicious instructions embedded in documents.

Implement the complete answer-generation pipeline.

## Phase 8: Advanced RAG

Teach me:

Query routing.

Parent-child retrieval.

Contextual retrieval.

Agentic RAG and tool-based retrieval.

Graph RAG and knowledge graphs.

Multi-document question answering.

Conversational RAG and chat history.

Query decomposition for complex questions.

When advanced techniques are justified and when simple RAG is better.

For every technique, explain the problem it solves, its implementation complexity, and its practical use cases.

## Phase 9: Production Architecture

Design a production-grade RAG backend using Node.js and Express.js.

Cover:

Modular architecture and feature-based folder structure.

Separate ingestion, embedding, retrieval, generation, and evaluation services.

Background job queues for document processing.

Asynchronous ingestion and retry mechanisms.

Batch embedding generation and rate-limit handling.

Caching and deduplication.

Streaming responses.

Conversation and document persistence.

Multi-user and multi-tenant data isolation.

Authentication and authorization.

Secure file uploads and file-size limits.

API validation and centralized error handling.

Rate limiting, timeouts, cancellation, and graceful shutdown.

Environment variables and secret management.

Logging, tracing, metrics, and monitoring.

Deployment, scaling, and cost optimization.

Explain which components are essential for an initial production release and which can be introduced as the system grows.

## Phase 10: Security and Reliability

Explain practical defenses against:

Prompt injection in user queries and retrieved documents.

Cross-tenant data leakage.

Unauthorized document retrieval.

Malicious and oversized uploads.

Sensitive data exposure.

Hallucinations and unsupported claims.

Embedding API failures and LLM provider outages.

Partial ingestion and inconsistent document updates.

Include validation, authorization, failure handling, and testing examples.

## Phase 11: RAG Evaluation and Optimization

Teach me how to measure whether my RAG system actually works.

Cover:

Retrieval precision and recall.

Hit rate and MRR.

NDCG and ranking quality.

Faithfulness and answer relevance.

Context relevance and citation correctness.

Golden evaluation datasets.

Automated evaluation and human review.

Retrieval and generation latency.

Token consumption and cost per query.

A/B testing and regression testing.

Improving chunking, retrieval, reranking, and prompts based on evaluation results.

Explain how to diagnose whether a bad answer comes from extraction, chunking, embeddings, retrieval, context construction, or generation.

## Phase 12: Testing and Deployment

Show me how to test:

Unit tests for ingestion, chunking, and retrieval.

Integration tests for vector search and LLM calls.

API tests using Jest and Supertest.

Mocking external APIs.

Testing empty retrieval results, malformed documents, timeouts, and provider errors.

Load testing and performance benchmarking.

CI/CD, deployment, health checks, and production monitoring.