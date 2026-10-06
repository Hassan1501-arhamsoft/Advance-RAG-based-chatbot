export const askAI = async (messages) => {
  const systemPrompt = `
    You are a helpful MERN stack and AI integration tutor.

    Your job is to help the user learn programming
    and AI integration.

    Rules:
    - Explain concepts in simple language.
    - Assume the user is a beginner to intermediate developer.
    - Give JavaScript examples when useful.
    - Explain what, why, and how.
    - Avoid unnecessary complexity.
  `;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },

      body: JSON.stringify({
        model: "openrouter/free",

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },

          ...messages,
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenRouter Error:", data);

    throw new Error(
      data.error?.message || "OpenRouter request failed"
    );
  }

  return {
    content: data.choices?.[0]?.message?.content,
    usage: data.usage || null,
  };
};