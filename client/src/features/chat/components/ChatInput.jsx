import { useState } from "react";

function ChatInput({ onSend, loading, disabled }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim() || loading || disabled) {
      return;
    }

    onSend(message);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition-all ${
        disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-900/10 hover:border-slate-300"
      }`}
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? "Please select a category above to start chatting..." : "Message AI Assistant..."}
        disabled={loading || disabled}
        className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none disabled:cursor-not-allowed"
      />

      <button
        type="submit"
        disabled={loading || disabled || !message.trim()}
        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 disabled:cursor-not-allowed ${
          loading
            ? "bg-slate-800 text-white"
            : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
        }`}
      >
        {loading ? (
          <>
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white"
              aria-hidden="true"
            />
            <span>Thinking...</span>
          </>
        ) : (
          <>
            <span>Send</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}

export default ChatInput;