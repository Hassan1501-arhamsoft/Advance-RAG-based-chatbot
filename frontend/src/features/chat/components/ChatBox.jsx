import { useEffect, useState, useRef } from "react";

import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

import {
  sendMessageStream,
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

  // 1. ADD THIS: A ref to track if the AI is actively streaming
  const isStreaming = useRef(false);

  // ==========================================
  // Load all previous conversations
  // ==========================================
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data.data);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };
    loadConversations();
  }, []);

  // ==========================================
  // Load selected conversation
  // ==========================================
  useEffect(() => {
    const loadConversation = async () => {
      // 2. PREVENT FETCH: Do not fetch from DB if we are currently streaming text!
      if (!conversationId || isStreaming.current) {
        return;
      }

      try {
        setLoading(true);
        const data = await getConversation(conversationId);
        setMessages(data.data.messages);
      } catch (error) {
        console.error("Failed to load conversation:", error);
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
    
    isStreaming.current = true;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
    ]);

    setLoading(true);

    try {
      await sendMessageStream({
        conversationId,
        message,
        
      

        onChunk: (chunkText) => {
          setLoading(false); 
          
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            
            if (lastMessage && lastMessage.role === "assistant") {
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + chunkText,
              };
            } else {
              updatedMessages.push({
                role: "assistant",
                content: chunkText,
              });
            }
            return updatedMessages;
          });
        },

        onError: (errorMessage) => {
          setLoading(false);
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            
            if (lastMessage && lastMessage.role === "assistant") {
              updatedMessages[updatedMessages.length - 1].content += `\n\n[Error: ${errorMessage}]`;
            } else {
              updatedMessages.push({ role: "assistant", content: errorMessage });
            }
            return updatedMessages;
          });
        },
      });

      // Stream is fully complete here. Refresh the sidebar history.
      const conversationsData = await getConversations();
      setConversations(conversationsData.data);
      
    } catch (error) {
      console.error(error);
      setLoading(false);
    } finally {
      
      isStreaming.current = false;
    }
  };

  // ==========================================
  // Open previous conversation
  // ==========================================
  const handleSelectConversation = (selectedConversationId) => {
    // 5. UNLOCK forcefully if user clicks a different chat mid-stream
    isStreaming.current = false; 
    setConversationId(selectedConversationId);
    localStorage.setItem("conversationId", selectedConversationId);
  };

  // ==========================================
  // Create new chat
  // ==========================================
  const handleNewChat = () => {
    // 6. UNLOCK forcefully if user clicks New Chat mid-stream
    isStreaming.current = false;
    localStorage.removeItem("conversationId");
    setConversationId(null);
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans antialiased">

  {/* =====================================
      SIDEBAR
  ====================================== */}
  <aside className="flex w-72 flex-col border-r border-slate-200 bg-slate-50/50">
    
    {/* Sidebar Header */}
    <div className="p-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          AI Assistant
        </h1>
      </div>

      <button
        onClick={handleNewChat}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        New Chat
      </button>
    </div>

    {/* Previous Conversations */}
    <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-slate-200">
      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Recent Conversations
      </p>

      {conversations.length === 0 ? (
        <p className="px-2 text-sm text-slate-400 italic">
          No conversations yet
        </p>
      ) : (
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => handleSelectConversation(conversation._id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                conversationId === conversation._id
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 font-medium"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 shrink-0 ${conversationId === conversation._id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="truncate">
                {conversation.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  </aside>

  {/* =====================================
      CHAT AREA
  ====================================== */}
  <main className="flex min-w-0 flex-1 flex-col bg-white relative">
    
    {/* Header */}
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Current Session
        </h2>
        <p className="text-xs font-medium text-slate-500">
          MERN + OpenRouter
        </p>
      </div>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
        
        {messages.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 shadow-inner ring-1 ring-slate-100">
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              How can I help you today?
            </h2>
            <p className="mt-2 text-base text-slate-500 max-w-sm">
              Ask me anything, brainstorm ideas, or write code to get started.
            </p>
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
  <div className="flex justify-start pt-2">
    <div className="flex w-fit items-center gap-2.5 rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-5 py-3.5 shadow-sm">
      <span className="animate-pulse text-sm font-medium text-slate-500">
        Thinking
      </span>
      <div className="flex items-center gap-1 pt-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]"></span>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]"></span>
      </div>
    </div>
  </div>
)}
      </div>
    </div>

    {/* Input Area */}
    <div className="bg-gradient-to-t from-white via-white to-transparent pt-6">
      <div className="mx-auto w-full max-w-4xl px-6 pb-6">
        <ChatInput
          onSend={handleSendMessage}
          loading={loading}
        />
        <p className="mt-3 text-center text-xs font-medium text-slate-400">
          AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>

  </main>

</div>
  );
}

export default ChatBox;