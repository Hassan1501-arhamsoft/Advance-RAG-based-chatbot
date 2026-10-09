export const generateSummary = async (
  messages,
  previousSummary = ""
) => {

  const conversationText = messages
    .map(
      (message) =>
        `${message.role}: ${message.content}`
    )
    .join("\n");


  const summaryPrompt = `
You are a conversation summarizer.

Create an updated summary of the conversation.

Previous summary:
${previousSummary || "No previous summary exists."}

New conversation messages:
${conversationText}

Instructions:

- Combine the previous summary with the new messages into a single, cohesive narrative.
- CRITICAL: Extract and strictly preserve any specific technical requirements, variable names, file names, or facts the user explicitly shared. Do not generalize them.
- If the user explicitly stated something is "important", you MUST retain the exact details in this summary.
- Preserve important user information.
- Preserve important questions and answers.
- Preserve user goals and preferences.
- Preserve important technical decisions.
- Preserve important context needed for future questions.
- Do not invent information.
- Remove conversational filler and unnecessary repetition.
- Keep the summary concise but ensure zero loss of specific technical facts.

Return only the updated summary.
`;


  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization:
          `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },

      body: JSON.stringify({
        model: "openrouter/free",

        messages: [
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
      }),
    }
  );


  const data = await response.json();


  if (!response.ok) {
    console.error(
      "Summary Error:",
      data
    );

    throw new Error(
      data.error?.message ||
      "Failed to generate conversation summary"
    );
  }


  return (
    data.choices?.[0]?.message?.content || ""
  );
};