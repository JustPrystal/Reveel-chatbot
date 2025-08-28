import { useEffect, useState } from "react";

export default function BotMessage({
  message = "Hello! How can I assist you today?",
  initial = false,
  quickReplies,
  delay = 0,
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show)
    return (
      <div className="bot-message bot-typing">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
    );

  return (
    <>
      <p className={`bot-message ${initial ? "bot-initial-message" : ""}`}>
        {message}
      </p>
      {quickReplies && (
          <div className="quickreplies">
            {quickReplies}
          </div>
      )}
    </>
  );
}
