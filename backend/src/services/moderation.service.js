export const moderateInput = async (message) => {
  const response = await fetch(
    "https://api.openai.com/v1/moderations",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: message,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenAI Moderation Error:", data);

    throw new Error(
      data.error?.message ||
        "Moderation request failed"
    );
  }

  const result = data.results?.[0];

  return {
    flagged: result?.flagged || false,
    categories: result?.categories || {},
    categoryScores:
      result?.category_scores || {},
  };
};