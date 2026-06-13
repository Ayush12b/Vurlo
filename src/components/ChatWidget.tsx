import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, X, Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "model";
  text: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hi! I'm here to help with questions about Vurlo's lights and decor. What can I help with?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check initially
    setBannerVisible(!!document.querySelector(".cookie-banner-animate"));

    // Set up observer to watch for CookieConsent banner changes
    const observer = new MutationObserver(() => {
      setBannerVisible(!!document.querySelector(".cookie-banner-animate"));
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = inputVal.trim();
    if (!messageText || isTyping) return;

    if (messageText.length > 500) {
      toast.error("Message must be under 500 characters.");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text: messageText }]);
    setInputVal("");
    setIsTyping(true);

    try {
      // Limit history to the last 10 messages, excluding the initial welcome greeting
      const userExchanges = messages.slice(1);
      const history = userExchanges.slice(-10);

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.source === "gemini" && data.reply) {
        setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: "Sorry, I'm having trouble responding right now. For help, please visit our Contact page.",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I'm having trouble responding right now. For help, please visit our Contact page.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageText = (msg: Message) => {
    if (msg.text.includes("Contact page") && msg.role === "model") {
      return (
        <>
          Sorry, I'm having trouble responding right now. For help, please visit our{" "}
          <Link
            to="/contact"
            className="text-violet-400 hover:text-violet-300 underline font-bold"
            onClick={() => setIsOpen(false)}
          >
            Contact page
          </Link>
          .
        </>
      );
    }
    return msg.text;
  };

  const bottomOffsetClass = bannerVisible ? "bottom-24" : "bottom-6";

  return (
    <>
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed right-6 z-50 p-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.6)] cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center ${bottomOffsetClass}`}
          aria-label="Open support chat"
        >
          <MessageCircle size={22} className="animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-8rem)] rounded-2xl border border-white/[0.08] bg-[#0c0c14]/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_50px_rgba(138,46,255,0.05)] flex flex-col transition-all duration-300 ${bottomOffsetClass}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 absolute" />
              <span className="text-xs font-bold text-white uppercase tracking-wider pl-1.5">
                Vurlo Support
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition duration-200 cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]"
              aria-label="Close support chat"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col no-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[82%] ${
                  msg.role === "user"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                <div
                  className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-none shadow-[0_2px_10px_rgba(124,58,237,0.15)]"
                      : "bg-white/[0.05] text-white/90 border border-white/[0.04] rounded-tl-none"
                  }`}
                >
                  {renderMessageText(msg)}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="self-start flex flex-col max-w-[82%]">
                <div className="bg-white/[0.05] text-white/90 border border-white/[0.04] rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center justify-center">
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-white/[0.06] flex gap-2 items-center bg-white/[0.01]"
          >
            <input
              type="text"
              placeholder="Ask support a question..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs focus:outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputVal.trim()}
              className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
export default ChatWidget;
