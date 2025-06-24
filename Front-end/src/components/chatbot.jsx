import React, { useState, useRef, useEffect } from "react";
import Lottie from "lottie-react";
import botAnimation from "../assets/bot.json";
import "../styles/chatbot.css";
import axios from "axios";
import { FiSend, FiMenu, FiX } from "react-icons/fi";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm Bricky, your construction assistant. How can I help you today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = input;
      setMessages([...messages, { text: userMessage, sender: "user" }]);
      setInput("");
      setLoading(true);

      try {
        const res = await axios.post("http://localhost:5000/api/ask-question", {
          query: userMessage,
        });

        const botMessage = {
          text: res.data.answer,
          sender: "bot",
          source: res.data.source
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          { text: "Sorry, I'm having trouble connecting. Please try again later.", sender: "bot", source: "error" }
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="chatbot-app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-button" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <h2 className="mobile-title">Bricky Assistant</h2>
      </div>

      <div className={`chatbot-container ${isMobileMenuOpen ? 'menu-open' : ''}`}>
        {/* Sidebar for larger screens */}
        <div className="chatbot-sidebar">
          <div className="sidebar-header">
            <div className="bot-avatar">
              <Lottie animationData={botAnimation} loop={true} className="bot-animation" />
            </div>
            <h2>Bricky</h2>
            <p className="bot-subtitle">Construction Assistant</p>
          </div>
          <div className="sidebar-info">
            <p>Ask me about:</p>
            <ul>
              <li>Construction materials</li>
              <li>Building codes</li>
              <li>Project planning</li>
              <li>Safety regulations</li>
            </ul>
          
          </div>
          <div className="sidebar-footer">
            <p>Powered by AI Construction Knowledge</p>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chatbot-main">
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.sender === "bot" && (
                  <div className="message-avatar">
                    <Lottie animationData={botAnimation} loop={false} className="bot-animation-small" />
                  </div>
                )}
                <div className="message-content">
                  <p>{msg.text}</p>
                  {msg.sender === "bot" && msg.source && (
                    <span className="message-source">
                      {msg.source === "kb"
                        ? "📚 Knowledge Base"
                        : msg.source === "openai"
                          ? "🤖 AI Generated"
                          : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <div className="message-avatar">
                  <Lottie animationData={botAnimation} loop={false} className="bot-animation-small" />
                </div>
                <div className="message-content">
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <div className="chatbot-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your construction question..."
                disabled={loading}
              />
              <button onClick={handleSend} disabled={loading || !input.trim()}>
                <FiSend size={20} />
              </button>
            </div>
            <p className="input-hint">Press Shift+Enter for a new line</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;