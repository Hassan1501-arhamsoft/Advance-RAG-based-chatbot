import { useEffect, useState } from "react";

import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

import {
  sendMessage,
  getConversation,
  getConversations,
} from "../services/chat.service";

function ChatBox() {
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] = useState([]);

  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem("conversationId");
  });


  // ==========================================
  // Load all previous conversations
  // ==========================================

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getConversations();

        setConversations(data.data);
        console.log("Conversations loaded:", data.data);
      } catch (error) {
        console.error(
          "Failed to load conversations:",
          error
        );
      }
    };

    loadConversations();
  }, []);


  // ==========================================
  // Load selected conversation
  // ==========================================

  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        return;
      }

      try {
        setLoading(true);

        const data = await getConversation(
          conversationId
        );

        setMessages(data.data.messages);
      } catch (error) {
        console.error(
          "Failed to load conversation:",
          error
        );

        localStorage.removeItem("conversationId");

        setConversationId(null);

        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId]);


  // ==========================================
  // Send message
  // ==========================================

  const handleSendMessage = async (message) => {
    const userMessage = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setLoading(true);

    try {
      const data = await sendMessage({
        conversationId,
        message,
      });

      const newConversationId =
        data.data.conversationId;

      setConversationId(newConversationId);

      localStorage.setItem(
        "conversationId",
        newConversationId
      );

      const aiMessage = {
        role: "assistant",
        content: data.data.response,
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);

      // Refresh conversation list
      const conversationsData =
        await getConversations();

      setConversations(
        conversationsData.data
      );
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // Open previous conversation
  // ==========================================

  const handleSelectConversation = (
    selectedConversationId
  ) => {
    setConversationId(
      selectedConversationId
    );

    localStorage.setItem(
      "conversationId",
      selectedConversationId
    );
  };


  // ==========================================
  // Create new chat
  // ==========================================

  const handleNewChat = () => {
    localStorage.removeItem(
      "conversationId"
    );

    setConversationId(null);

    setMessages([]);
  };


  return (
    <div className="flex h-screen bg-gray-100">

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="flex w-72 flex-col border-r border-gray-200 bg-white">

        {/* Sidebar Header */}

        <div className="border-b border-gray-200 p-4">

          <h1 className="text-lg font-semibold text-gray-800">
            🤖 AI Chatbot
          </h1>

          <button
            onClick={handleNewChat}
            className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
           💬 New Chat
          </button>

        </div>


        {/* Previous Conversations */}

        <div className="flex-1 overflow-y-auto p-3">

          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Previous Conversations
          </p>


          {conversations.length === 0 ? (

            <p className="px-2 text-sm text-gray-400">
              No conversations yet
            </p>

          ) : (

            <div className="space-y-1">

              {conversations.map(
                (conversation) => (

                  <button
                    key={conversation._id}
                    onClick={() =>
                      handleSelectConversation(
                        conversation._id
                      )
                    }
                    className={`w-full rounded-lg px-3 py-3 text-left text-sm transition ${
                      conversationId ===
                      conversation._id
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >

                    <p className="truncate font-medium">
                      {conversation.title}
                    </p>

                  </button>

                )
              )}

            </div>

          )}

        </div>

      </aside>


      {/* =====================================
          CHAT AREA
      ====================================== */}

      <main className="flex min-w-0 flex-1 flex-col">

        {/* Header */}

        <div className="border-b border-gray-200 bg-white px-6 py-4">

          <h2 className="text-xl font-semibold text-gray-800">
            🤖 AI Chat
          </h2>

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

      </main>

    </div>
  );
}

export default ChatBox;