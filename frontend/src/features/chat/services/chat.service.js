import api from "../../../api/axios.js";

export const sendMessage = async ({
  conversationId,
  message,
}) => {
  const response = await api.post("/chat", {
    conversationId,
    message,
  });

  return response.data;
};

export const getConversation = async (conversationId) => {
  const response = await api.get(
    `/conversations/${conversationId}`
  );

  return response.data;
};

export const getConversations = async () => {
  const response = await api.get("/conversations");

  return response.data;
};