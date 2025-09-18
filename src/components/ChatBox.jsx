import { useState } from "react";
import axios from "axios";
import "../styles/chat.scss";
import simage from "../assets/simage.jpg";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (customInput) => {
    const text = customInput || input;
    if (!text.trim()) return;

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsTyping(true); // show typing indicator

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        query: text,
        sessionId,
      });

      setSessionId(res.data.sessionId);

      // Add bot reply
      setMessages((prev) => [...prev, { role: "bot", text: res.data.answer }]);
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: " Backend not reachable" },
      ]);
    } finally {
      setIsTyping(false); // hide typing indicator
    }
  };

  const resetSession = async () => {
    if (sessionId) {
      try {
        await axios.delete(`${API_URL}/reset/${sessionId}`);
      } catch (err) {
        console.error("Reset error:", err);
      }
    }
    setMessages([]);
    setSessionId(null);
    setIsTyping(false);
  };

  return (
    <div className="chatbox">
      <div className="chat-header">✨ AI Assist</div>

      <div className="chat-body">
        {messages.length === 0 && !isTyping && (
          <div className="chat-intro">
            <img src={simage} alt="AI" className="chat-intro-img" />
            <p>What do you want to know about James?</p>
            <div className="chat-buttons">
              <button onClick={() => sendMessage("Generate Summary")}>
                Generate Summary
              </button>
              <button
                onClick={() =>
                  sendMessage("Are they a good fit for my job post?")
                }
              >
                Are they a good fit for my job post?
              </button>
              <button onClick={() => sendMessage("What is their training style?")}>
                What is their training style?
              </button>
            </div>
          </div>
        )}

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              {m.text}
            </div>
          ))}

          {isTyping && (
            <div className="chat-message bot typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
        </div>
      </div>

      <div className="chat-footer">
        <input
          type="text"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={() => sendMessage()}>➤</button>
        <button className="reset-btn" onClick={resetSession}>
          Reset
        </button>
      </div>
    </div>
  );
}
