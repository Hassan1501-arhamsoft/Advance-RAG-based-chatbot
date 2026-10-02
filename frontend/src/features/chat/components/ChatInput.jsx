import { useState } from "react";

function ChatInput({ onSend, loading }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim() || loading) {
      return;
    }

    onSend(message);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 border-t border-gray-200 bg-white p-4"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={loading}
        className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
      />

      <button
        type="submit"
        disabled={loading || !message.trim()}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? "Thinking..." : "Send"}
      </button>
    </form>
  );
}

export default ChatInput;