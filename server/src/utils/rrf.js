/**
 * Reciprocal Rank Fusion (RRF) algorithm to combine vector and text search results.
 * @param {Array} vectorResults - Results from MongoDB Atlas Vector Search
 * @param {Array} textResults - Results from MongoDB Atlas Full-Text Search
 * @param {number} k - Smoothing constant (standard default is 60)
 * @returns {Array} Combined and ranked documents with RRF scores
 */
export function reciprocalRankFusion(vectorResults, textResults, k = 60) {
  const rrfScores = new Map();
  const docMap = new Map();

  // Score vector search rankings
  vectorResults.forEach((doc, rank) => {
    const id = doc._id.toString();
    docMap.set(id, doc);
    const score = 1 / (k + rank + 1);
    rrfScores.set(id, (rrfScores.get(id) || 0) + score);
  });

  // Score text search rankings
  textResults.forEach((doc, rank) => {
    const id = doc._id.toString();
    if (!docMap.has(id)) docMap.set(id, doc);
    const score = 1 / (k + rank + 1);
    rrfScores.set(id, (rrfScores.get(id) || 0) + score);
  });

  // Sort by RRF score descending
  return Array.from(rrfScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      ...docMap.get(id),
      rrfScore: score,
    }));
}