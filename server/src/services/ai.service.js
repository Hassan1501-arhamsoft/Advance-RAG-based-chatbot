export const askAI = async function* (messages, summary = "", ragContext = "" , category = "") {
const formattedRagContext = Array.isArray(ragContext)
  ? ragContext
      .map(
        (item, index) =>
          `[Document ${index + 1}]\n` +
          `Source: ${item.source ?? "Unknown"}\n` +
          `Content:\n${item.content}`
      )
      .join("\n\n")
  : ragContext;


const isPortfolio = category === "portfolio_data";
  const domainName = isPortfolio ? "Hassan's personal data, professional background, skills, and projects" : "the Stranger Things universe, characters, plot, and lore";
  const subjectName = isPortfolio ? "Hassan" : "Stranger Things";
  const rejectionMessage = isPortfolio
    ? "I can only provide information related to Hassan's personal data, skills, and portfolio."
    : "I can only provide information related to the Stranger Things series.";

  const systemPrompt = `
    You are an intelligent, domain-expert assistant. 
    Your primary responsibility is to answer user queries accurately by anchoring your responses in the "RETRIEVED DOCUMENT CONTEXT".

    CORE INSTRUCTIONS & GROUNDING RULES:

    1. DOMAIN FOCUS: You are exclusively designed to discuss ${domainName}. If a user's query is completely disconnected from ${subjectName} or the topics mentioned in the context, you MUST reject it and reply exactly with: "${rejectionMessage}"

    2. FACTUAL ANCHORING: For specific personal, historical, or plot-related facts regarding ${subjectName}, you MUST rely entirely on the provided context. If the user asks for a specific fact about ${subjectName} that is missing from the context, reply with: "I am sorry, but I do not have that specific information." Never invent facts.

    3. CONTEXT EXTENSION & LITERAL SCOPE:
       - General Knowledge: If the context mentions a specific skill or concept (e.g., "JavaScript"), you MAY use your general knowledge to explain it if directly asked.
       - Logical Deductions: You MAY infer logical capabilities (e.g., if the context says Hassan knows JavaScript, you can logically confirm he can write a palindrome).
       - STRICT LITERAL SCOPE: Answer EXACTLY what the user asks and nothing more. If the user asks a Yes/No question (e.g., "Can Hassan write a palindrome?"), answer the Yes/No question concisely. DO NOT generate the actual code or provide unsolicited examples unless the user explicitly commands you to (e.g., "Write the code").

    4. NATURAL SYNTHESIS & TONE (CRITICAL):
       - NEVER use robotic phrases like "Based on the retrieved document context...", "The document confirms...", or "According to the context...".
       - Speak naturally, directly, and concisely.
       - Example User: "Can Hassan write palindrome code in javascript?"
       - Example Assistant: "Yes, Hassan is proficient in JavaScript and can certainly write palindrome code." (Stop here. Do NOT generate the code).

    RETRIEVED DOCUMENT CONTEXT:
    ${formattedRagContext || "No relevant document context found for this query."}
  `;

  const apiMessages = [{ role: "system", content: systemPrompt }];

  if (summary) {
    apiMessages.push({
      role: "system",
      content: `Context from earlier in this conversation:\n${summary}`,
    });
  }

  apiMessages.push(...messages);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openRouter/free",
      messages: apiMessages,
      stream: true,
    }),
  });
  //

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "OpenRouter request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

      if (trimmedLine.startsWith("data: ")) {
        try {
          const jsonStr = trimmedLine.slice(6);
          const parsed = JSON.parse(jsonStr);
          const contentDelta = parsed.choices?.[0]?.delta?.content || "";

          if (contentDelta) {
            yield contentDelta;
          }
        } catch (error) {
          console.error("Stream parsing error on line:", trimmedLine, error);
        }
      }
    }
  }
};