import { useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { sendMessage } from "../services/chat.service";

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (message) => {
    const userMessage = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await sendMessage(message);

      const aiMessage = {
        role: "assistant",
        content: data.data.response,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: error.message || "Something went wrong.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">
            AI Chatbot
          </h1>

          <p className="text-sm text-gray-500">
            MERN + OpenRouter
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-700">
                  How can I help you?
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Ask me anything to get started.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                message={message.content}
              />
            ))
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.15s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.3s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default ChatBox;