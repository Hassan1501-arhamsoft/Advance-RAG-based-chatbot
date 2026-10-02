export const askAI = async (message) => {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },

      body: JSON.stringify({
        model: "liquid/lfm-2.5-2.6b:free",

        messages: [
          {
            role: "user",
            content: message,
          },
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

  return data.choices?.[0]?.message?.content;
};