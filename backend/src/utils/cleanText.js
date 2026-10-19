
/**
 * Clean extracted text before chunking for RAG.
 *
 * @param {string} text - Raw extracted document text.
 * @returns {string} Cleaned text.
 */
export const cleanText = (text) => {
  if (typeof text !== "string") {
    throw new TypeError("cleanText expects a string.");
  }

  return text
    // Remove null characters.
    .replace(/\0/g, "")

    // Normalize Windows and old Mac line endings.
    .replace(/\r\n?/g, "\n")

    // Replace non-breaking spaces with regular spaces.
    .replace(/\u00A0/g, " ")

    // Remove trailing whitespace from each line.
    .replace(/[ \t]+$/gm, "")

    // Reduce 3+ consecutive newlines to a paragraph break.
    .replace(/\n{3,}/g, "\n\n")

    // Remove whitespace at the start and end of the document.
    .trim();
};
