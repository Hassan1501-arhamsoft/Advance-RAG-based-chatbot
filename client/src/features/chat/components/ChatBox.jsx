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
  
  // Category state: null means no category selected yet (input disabled)
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem("conversationId");
  });

  const isStreaming = useRef(false);

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

useEffect(() => {
  const loadConversation = async () => {
    if (!conversationId || isStreaming.current) {
      return;
    }

    try {
      setLoading(true);
      const data = await getConversation(conversationId);
      
      setMessages(data.data.messages);
      
      // SET CATEGORY FROM SAVED CONVERSATION TO UNLOCK INPUT
      if (data.data.category) {
        setSelectedCategory(data.data.category);
      } else if (data.data.conversation?.category) {
        setSelectedCategory(data.data.conversation.category);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      localStorage.removeItem("conversationId");
      setConversationId(null);
      setMessages([]);
      setSelectedCategory(null);
    } finally {
      setLoading(false);
    }
  };

  loadConversation();
}, [conversationId]);

  const handleSendMessage = async (message) => {
    if (!selectedCategory) return;

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
        category: selectedCategory, // Send chosen category to backend
        onInit: (newConversationId) => {
        if (!conversationId) {
          setConversationId(newConversationId);
          localStorage.setItem("conversationId", newConversationId);
        }
      },
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

      const conversationsData = await getConversations();
      setConversations(conversationsData.data);
      
    } catch (error) {
      console.error(error);
      setLoading(false);
    } finally {
      isStreaming.current = false;
    }
  };

 const handleSelectConversation = async (selectedConversationId) => {
  isStreaming.current = false; 
  setConversationId(selectedConversationId);
  localStorage.setItem("conversationId", selectedConversationId);
  
  // Find conversation from list if category is available immediately
  const targetConv = conversations.find((c) => c._id === selectedConversationId);
  if (targetConv && targetConv.category) {
    setSelectedCategory(targetConv.category);
  }
};

  const handleNewChat = () => {
    isStreaming.current = false;
    localStorage.removeItem("conversationId");
    setConversationId(null);
    setMessages([]);
    setSelectedCategory(null); // Reset category selection on new chat
  };

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans antialiased">

  {/* SIDEBAR */}
  <aside className="flex w-72 flex-col border-r border-slate-200 bg-slate-50/50">
    <div className="p-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          AI Assistant
        </h1>
      </div>

      <button
        onClick={handleNewChat}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        New Chat
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-3 py-2">
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
              <p className="truncate">{conversation.title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  </aside>

  {/* CHAT AREA */}
  <main className="flex min-w-0 flex-1 flex-col bg-white relative">
    
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Current Session {selectedCategory && <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded-md ml-2 text-slate-600">Category: {selectedCategory === "portfolio_data" ? "Hassan's Info" : "Stranger Things"}</span>}
        </h2>
        <p className="text-xs font-medium text-slate-500">
          MERN + OpenRouter Advanced RAG
        </p>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
        
        {messages.length === 0 && !selectedCategory ? (
          // CATEGORY SELECTION SCREEN
          <div className="flex h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 shadow-inner ring-1 ring-slate-100">
              <span className="text-3xl">📂</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Choose a Chat Category to Begin
            </h2>
            <p className="mt-2 text-base text-slate-500 max-w-md mb-8">
              Select a knowledge topic below to unlock the chat input and focus the AI assistant's answers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
              <button
                onClick={() => setSelectedCategory("portfolio_data")}
                className="flex flex-col items-start p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50/50 transition-all text-left shadow-sm group"
              >
                <span className="text-2xl mb-2">👨‍💻</span>
                <h3 className="font-semibold text-slate-900 group-hover:text-slate-950">Hassan's Personal Info</h3>
                <p className="text-xs text-slate-500 mt-1">Explore Hassan's resume, tech stack, and portfolio projects.</p>
              </button>

              <button
                onClick={() => setSelectedCategory("stranger_things")}
                className="flex flex-col items-start p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50/50 transition-all text-left shadow-sm group"
              >
                <span className="text-2xl mb-2">🚲</span>
                <h3 className="font-semibold text-slate-900 group-hover:text-slate-950">Stranger Things Details</h3>
                <p className="text-xs text-slate-500 mt-1">Dive deep into Hawkins, the Upside Down, characters, and lore.</p>
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold text-slate-900">Category Selected!</h2>
            <p className="text-sm text-slate-500 mt-1">Ask anything about {selectedCategory === "portfolio_data" ? "Hassan's background" : "Stranger Things"}.</p>
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

        {loading && (
          <div className="flex justify-start pt-2">
            <div className="flex w-fit items-center gap-2.5 rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-5 py-3.5 shadow-sm">
              <span className="animate-pulse text-sm font-medium text-slate-500">Thinking</span>
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
          disabled={!selectedCategory} // Disable input until category is selected
        />
        <p className="mt-3 text-center text-xs font-medium text-slate-400">
          AI answers are strictly restricted to the selected category.
        </p>
      </div>
    </div>

  </main>

</div>
  );
}

export default ChatBox;