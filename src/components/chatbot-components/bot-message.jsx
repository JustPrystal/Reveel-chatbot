export default function BotMessage({
  message = "Hello! How can I assist you today?",
  initial = false,
}) {
  return (
    <>
      <p className={`bot-message ${initial ? "bot-initial-message" : ""}`}>
        {message}
      </p>
    </>
  );
}
