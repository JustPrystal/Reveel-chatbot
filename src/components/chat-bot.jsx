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

  const [step, setStep] = useState("initial");
  const [messages, setMessages] = useState([]);
  const [isBugReport, setIsBugReport] = useState(null);
  const [userInfo, setUserInfo] = useState({
    email: null,
    userRole: null,
    device: null,
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const roles = [
    { key: "viewer", label: "Free user" },
    { key: "subscriber", label: "Premium/VIP Subscriber" },
    { key: "filmmaker", label: "Filmmaker" },
    { key: "advertiser", label: "Advertiser" },
    { key: "affiliate", label: "Affiliate" },
  ];
  const bugTypes = [
    { key: "website", label: "Website Bug" },
    { key: "app", label: "App Bug" },
    { key: "viewing_experience", label: "Viewing Experience Bug" },
    { key: "other", label: "Other" },
  ];

  // Helper Functions
  const addMessage = (type, text, delay = 0) => {
    const message = { type, text, delay };
    setMessages((prev) => [...prev, message]);
  };
  const addQuickReply = (text, options, delay = 600, onSelect) => {
    setMessages((prev) => [
      ...prev,
      { type: "bot", text, quickReplies: options, delay, onSelect },
    ]);
  };
  const clearQuickReplies = () => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.type === "bot" && msg.quickReplies
          ? { ...msg, quickReplies: null }
          : msg
      )
    );
  };
  const extractLink = (data) => {
    const linkMatch = data.match(/https?:\/\/[^\s]+/);
    return linkMatch ? linkMatch[0] : null;
  };

  const handleRoleSelection = (role) => {
    setUserInfo((prev) => ({ ...prev, userRole: role.key }));
    addMessage("user", role.label);
    clearQuickReplies();

    addMessage(
      "bot",
      "All set! Feel free to type your questions in the box below.",
      600
    );
    setStep("chat");
  };
  const handleEmailStep = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
      addMessage("user", input);
      addMessage(
        "bot",
        "Please enter a valid email address (e.g. user@example.com).",
        600
      );
      setInput("");
      return;
    }
    await setUserInfo((prev) => ({ ...prev, email: input }));
    addMessage("user", input);

    if (isBugReport) {
      addMessage(
        "bot",
        "What device(s) are you facing this bug on? (e.g., iPhone 12, MacBook Pro)",
        600
      );
      setStep("device");
    } else {
      addQuickReply(
        "Great! To help you better, what kind of account do you have with us?",
        roles.map((role) => (
          <button key={role.key} onClick={() => handleRoleSelection(role)}>
            {role.label}
          </button>
        )),
        600,
        handleRoleSelection
      );
      setStep("role");
    }
    setInput("");
  };
  const handleDeviceStep = () => {
    setUserInfo((prev) => ({ ...prev, device: input }));
    addMessage("user", input);

    addQuickReply(
      "What type of bug are you experiencing?",
      bugTypes.map((bugType) => (
        <button
          key={bugType.key}
          onClick={() => handleBugTypeSelection(bugType)}
        >
          {bugType.label}
        </button>
      )),
      600,
      handleBugTypeSelection
    );
    // setStep("bugTypes");
    setInput("");
  };
  const handleBugTypeSelection = (bugType) => {
    setUserInfo((prev) => ({ ...prev, bugType: bugType.key }));
    addMessage("user", bugType.label);

    if (bugType.key === "app") {
      setStep("app");
      addMessage(
        "bot",
        "Please provide your OS version and the app version.",
        600
      );
    } else if (bugType.key === "website") {
      setStep("browser");
      addMessage(
        "bot",
        "Please provide the name and version of the browser you were using.",
        600
      );
    } else {
      setStep("description");
      addMessage("bot", "Please describe the bug in detail.", 600);
    }
  };
  const handleChatStep = async () => {
    const userMsg = input;
    addMessage("user", userMsg);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `https://umer545.app.n8n.cloud/webhook/d90cc1bd-d36d-4185-b01b-16ba366872e7?response=${encodeURIComponent(
          userMsg
        )}&email=${encodeURIComponent(userInfo.email)}&bug-report=${
          isBugReport ? "true" : "false"
        }&user-role=${encodeURIComponent(userInfo.userRole)}`
      );
      let data = await res.text();
      data = data.replace(/"/g, "");
      const link = extractLink(data);
      const messageText = link ? data.replace(link, "").trim() : data;
      addMessage(
        "bot",
        <>
          {messageText}
          {link && (
            <>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: "4px" }}
              >
                Link to Blog
              </a>{" "}
              <p>feel free to ask further questions</p>
            </>
          )}
        </>
      );
    } catch (err) {
      addMessage("bot", "Sorry, there was an error getting a response.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleBrowserStep = () => {
    setUserInfo((prev) => ({ ...prev, browser: input }));
    addMessage("user", input);
    addMessage("bot", "Please describe the bug in detail.", 600);
    setStep("description");
    setInput("");
  };
  const handleAppStep = () => {
    setUserInfo((prev) => ({ ...prev, osVersion: input }));
    addMessage("user", input);
    addMessage("bot", "Please provide your app version.", 600);
    setStep("appVersion");
    setInput("");
  };
  const handleAppVersionStep = () => {
    setUserInfo((prev) => ({ ...prev, appVersion: input }));
    addMessage("user", input);
    addMessage("bot", "Please describe the bug in detail.", 600);
    setStep("description");
    setInput("");
  };
  const handleDescriptionStep = async () => {
    setUserInfo((prev) => ({ ...prev, description: input }));
    addMessage("user", input);
    setStep("submitted");
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `https://umer545.app.n8n.cloud/webhook/d90cc1bd-d36d-4185-b01b-16ba366872e7?response=${encodeURIComponent(
          input
        )}&email=${encodeURIComponent(userInfo.email)}&bug-report=true`
      );
      const data = await res.text();
      addMessage("bot", data);
    } catch (error) {
      addMessage(
        "bot",
        "Sorry, something went wrong while submitting your report."
      );
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (input.trim() === "") return;
    switch (step) {
      case "email":
        await handleEmailStep();
        break;
      case "device":
        await handleDeviceStep();
        break;
      case "browser":
        await handleBrowserStep();
        break;
      case "app":
        await handleAppStep();
        break;
      case "appVersion":
        await handleAppVersionStep();
        break;
      case "description":
        await handleDescriptionStep();
        break;
      case "chat":
        await handleChatStep();
        break;
      default:
        break;
    }
  };

  return (
    <div className="chatbot-view-zl2mxh3zm">
      <div className="chatbot-header">
        <span className="chatbot-title">Reveel Chatbot</span>
      </div>
      <div className="container">
        <div className="inner-dmxlcop12ze">
          <BotMessage
            message="Hi there! How can I help you today?"
            quickReplies={
              isBugReport === null ? (
                <>
                  <button
                    disabled={isBugReport !== null}
                    onClick={() => (setIsBugReport(true), setStep("email"))}
                  >
                    Report a bug
                  </button>
                  <button
                    disabled={isBugReport !== null}
                    onClick={() => (setIsBugReport(false), setStep("email"))}
                  >
                    General Inquiry
                  </button>
                </>
              ) : null
            }
          />
          {isBugReport !== null && (
            <>
              <UserMessage
                message={
                  isBugReport
                    ? "I would like to report a bug"
                    : "I have a few questions about reveel"
                }
              />
              <BotMessage
                message="Please enter your email so we can get in touch if needed."
                delay={600}
              />
            </>
          )}
          {messages.map((msg, idx) =>
            msg.type === "bot" ? (
              <BotMessage
                key={idx}
                message={msg.text}
                delay={msg.delay}
                quickReplies={msg.quickReplies}
              />
            ) : (
              <UserMessage key={idx} message={msg.text} delay={msg.delay} />
            )
          )}
          {loading && <BotTyping />}
          <button
            className="global-reset-chat-btn"
            style={{
              width: "fit-content",
              zIndex: 1000,
              border: "none",
              color: "white",
              background: "#c53030",
              padding: "8px 16px",
              borderRadius: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              margin: "auto auto 0",
            }}
            onClick={() => {
              setMessages([]);
              setIsBugReport(null);
              setUserInfo({
                email: null,
                userRole: null,
                device: null,
              });
              setInput("");
              setLoading(false);
              setStep("initial");
            }}
          >
            Reset Chat
          </button>
        </div>
      </div>
      <div className="input-field-x4cb14x">
        <input
          type="text"
          disabled={loading || step === "role" || step === "initial"}
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
