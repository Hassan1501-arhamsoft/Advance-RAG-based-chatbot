function ChatMessage({ message, role }) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-6 whitespace-pre-wrap">
          {message}
        </p>
      </div>
    </div>
  );
}

export default ChatMessage;