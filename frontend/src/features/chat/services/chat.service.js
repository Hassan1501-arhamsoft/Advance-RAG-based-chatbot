export const sendMessage = async (message) => {
  const response = await fetch("http://localhost:5000/api/chat", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send message");
  }

  return data;
};