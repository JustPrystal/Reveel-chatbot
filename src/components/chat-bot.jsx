import { useState } from "react";
import BotMessage from "./chatbot-components/bot-message";
import UserMessage from "./chatbot-components/user-message";

function BotTyping() {
  return (
    <div className="bot-message bot-typing">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
}

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [isBugReport, setIsBugReport] = useState(null);
  const [userInfo, setUserInfo] = useState({
    email: null,
    userRole: null,
    description: null,
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const emailValue = e.target.elements.email.value;
    setUserInfo({ ...userInfo, email: emailValue });
  };
  const handleDescriptionSubmit = async (e) => {
    e.preventDefault();
    const descriptionValue = e.target.elements.description.value;
    await setUserInfo({ ...userInfo, description: descriptionValue });
    try {
      const res = await fetch(
        `https://umer545.app.n8n.cloud/webhook/d90cc1bd-d36d-4185-b01b-16ba366872e7?response=${userInfo.description}&email=${userInfo.email}&bug_report=${isBugReport}`
      );
      const data = await res.text();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSend = async () => {
    if (input.trim() === "") return;
    const userMsg = { type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `https://umer545.app.n8n.cloud/webhook/d90cc1bd-d36d-4185-b01b-16ba366872e7?response=${encodeURIComponent(
          input
        )}&email=${encodeURIComponent(userInfo.email)}&bug_report=${
          isBugReport ? "true" : "false"
        }&user-role=${encodeURIComponent(userInfo.userRole)}`
      );
      let data = await res.text();
      data = data.replace(/"/g, "");
      if (data !== "bug_report") {
        setMessages((prev) => [...prev, { type: "bot", text: data }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Could you provide more information about the problem you are facing",
          },
        ]);
        setIsBugReport(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Sorry, there was an error getting a response." },
      ]);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-view-zl2mxh3zm">
      <div className="chatbot-header">
        <span className="chatbot-title">Reveel Chatbot</span>
      </div>
      <div className="inner-dmxlcop12ze">
        <div
          className="bot-initial-message"
          style={{ flexDirection: "column", alignItems: "flex-start" }}
        >
          <BotMessage message="Hello! what can i assist you with" />
          {isBugReport === null && (
            <div className="quickreplies">
              <button
                disabled={isBugReport !== null}
                onClick={() => setIsBugReport(true)}
              >
                Report a bug
              </button>
              <button
                disabled={isBugReport !== null}
                onClick={() => setIsBugReport(false)}
              >
                General Inquiry
              </button>
            </div>
          )}
        </div>
        {isBugReport !== null && (
          <UserMessage
            message={
              isBugReport ? "This is a bug report" : "This is a general inquiry"
            }
          />
        )}
        {isBugReport !== null && <BotMessage message="What is your email?" />}
        {isBugReport !== null && userInfo.email === null && (
          <form
            className="user-message bot-initial-message"
            onSubmit={handleEmailSubmit}
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <p>Enter Your email:</p>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
            />
            <button type="submit">Submit</button>
          </form>
        )}
        {userInfo.email !== null && (
          <UserMessage message={`${userInfo.email}`} />
        )}
        {isBugReport === true && userInfo.email !== null && (
          <BotMessage
            message={
              <>
                Could you provide a detailed description of the bug you are
                facing,
                <br />
                <br />
                1) please provide the device/devices you faced the bug on
                <br />
                2) if you faced the bug on the website please provide the name
                of the browser you were using
                <br />
                3) if you faced the bug on the app then provide your OS version
                and the app version
              </>
            }
          />
        )}
        {isBugReport === true &&
          userInfo.email !== null &&
          userInfo.description === null && (
            <form
              className="user-message bot-initial-message"
              onSubmit={handleDescriptionSubmit}
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <p>Enter a brief description of the issue:</p>
              <textarea
                name="description"
                placeholder="Describe the issue..."
                required
                style={{
                  width: "100%",
                  minHeight: "200px",
                  maxHeight: "200px",
                  maxWidth: "300px",
                }}
              />
              <button type="submit">Submit</button>
            </form>
          )}
        {isBugReport === true &&
          userInfo.email !== null &&
          userInfo.description !== null && (
            <>
              <UserMessage message={`${userInfo.description}`} />
              <BotMessage
                message={`Thank you for your report. We'll get back to you soon`}
              />
            </>
          )}
        {isBugReport === false && userInfo.email !== null && (
          <div
            className="bot-initial-message"
            style={{ flexDirection: "column", alignItems: "flex-start" }}
          >
            <BotMessage message="What is your role" />
            {userInfo.userRole === null && (
              <div className="quickreplies">
                <button
                  disabled={userInfo.userRole !== null}
                  onClick={() =>
                    setUserInfo({ ...userInfo, userRole: "viewer" })
                  }
                >
                  Viewer
                </button>
                <button
                  disabled={userInfo.userRole !== null}
                  onClick={() =>
                    setUserInfo({ ...userInfo, userRole: "subscriber" })
                  }
                >
                  Subscriber
                </button>
                <button
                  disabled={userInfo.userRole !== null}
                  onClick={() =>
                    setUserInfo({ ...userInfo, userRole: "film_maker" })
                  }
                >
                  Film Maker
                </button>
                <button
                  disabled={userInfo.userRole !== null}
                  onClick={() =>
                    setUserInfo({ ...userInfo, userRole: "advertiser" })
                  }
                >
                  Advertiser
                </button>
                <button
                  disabled={userInfo.userRole !== null}
                  onClick={() =>
                    setUserInfo({ ...userInfo, userRole: "affiliate" })
                  }
                >
                  Affiliate
                </button>
              </div>
            )}
          </div>
        )}
        {isBugReport === false &&
          userInfo.email !== null &&
          userInfo.userRole !== null && (
            <>
              <UserMessage message={`${userInfo.userRole}`} />
              <BotMessage
                message={
                  "You can now use the field at the bottom of your screen to ask questions"
                }
              />
            </>
          )}
        {isBugReport === true &&
          userInfo.email !== null &&
          userInfo.description !== null && (
            <button
              style={{
                marginTop: "10px",
                border: "none",
                color: "#333",
                background: "transparent",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => {
                setMessages([]);
                setIsBugReport(null);
                setUserInfo({
                  email: null,
                  userRole: null,
                  description: null,
                });
                setInput("");
                setLoading(false);
              }}
            >
              Reset Chat
            </button>
          )}
        {messages.map((msg, idx) =>
          msg.type === "bot" ? (
            <BotMessage key={idx} message={msg.text} />
          ) : (
            <UserMessage key={idx} message={msg.text} />
          )
        )}
        {loading && <BotTyping />}
      </div>
      <div className="input-field-x4cb14x">
        <input
          type="text"
          disabled={
            !(
              isBugReport === false &&
              userInfo.email !== null &&
              userInfo.userRole !== null
            ) || loading
          }
          placeholder="Type your message..."
          className="bot-input-field-x1nmsnr92"
          value={input}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="input-send-btn"
          type="button"
          disabled={loading}
          onClick={handleSend}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="800px"
            height="800px"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z"
              fill="#fff"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
