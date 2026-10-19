function ChatMessage({ message, role }) {
  const isUser = role === "user";

  return (
    <div
  className={`flex w-full ${
    isUser ? "justify-end" : "justify-start"
  }`}
>
  <div
    className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl ${
      isUser
        ? "bg-slate-900 text-white rounded-br-sm shadow-sm"
        : "bg-slate-50 text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm"
    }`}
  >
    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-normal">
      {message}
    </p>
  </div>
</div>
  );
}

export default ChatMessage;