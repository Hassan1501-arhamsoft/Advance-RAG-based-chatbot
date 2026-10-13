import api from "../../../api/axios.js";

// Keep your existing getConversation and getConversations functions
export const getConversation = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}`);
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get("/conversations");
  return response.data;
};


export const sendMessageStream = async ({ conversationId, message, onChunk, onError }) => {
  try {
    
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        
      },
      body: JSON.stringify({ conversationId, message }),
    });

    if (!response.ok) {
      throw new Error("Failed to connect to the chat stream.");
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
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith("data: ")) {
          try {
            const dataStr = trimmedLine.slice(6);
            const parsed = JSON.parse(dataStr);
            
            if (parsed.event === "chunk" && onChunk) {
              onChunk(parsed.content);
            } else if (parsed.event === "error" && onError) {
              onError(parsed.message);
            }
          } catch (e) {
            console.error("Stream parsing error:", e);
          }
        }
      }
    }
  } catch (error) {
    if (onError) onError(error.message);
  }
};