import { useState } from "react";
import { askQuestion } from "../api/ragApi";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import SourcePanel from "./SourcePanel";
import "../styles/chat.css";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await askQuestion(input);

      const botMsg = {
        role: "assistant",
        text: data.answer || "No answer found.",
      };

      setMessages((prev) => [...prev, botMsg]);
      setSources(data.sources || []);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error fetching response." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-window">
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            role={msg.role}
            text={msg.text}
          />
        ))}

        {loading && (
          <MessageBubble
            role="assistant"
            text="Thinking..."
            loading
          />
        )}
      </div>

      <SourcePanel sources={sources} />

      <InputBox
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        loading={loading}
      />
    </div>
  );
}
