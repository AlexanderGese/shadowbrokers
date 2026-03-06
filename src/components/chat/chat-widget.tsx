"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./chat-message";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: newMessages.slice(-10),
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "[ERROR] Failed to get response. Try again." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-4 z-50 w-12 h-12 border transition-all flex items-center justify-center ${
          open
            ? "bg-accent/20 border-accent text-accent"
            : "bg-card-bg border-card-border text-muted hover:text-accent hover:border-accent/50"
        }`}
        title="AI Chat (press /)"
      >
        <span className="text-lg">{open ? "X" : ">"}_</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-6rem)] border border-card-border bg-background flex flex-col shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-card-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-accent tracking-widest font-bold">SHADOWBROKERS AI</span>
              <span className="text-[8px] text-muted">GPT-4O-MINI</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[9px] text-muted hover:text-foreground transition-colors"
                >
                  CLEAR
                </button>
              )}
              <span className="text-[9px] text-muted">ESC</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-[10px] text-muted tracking-widest mb-2">INTELLIGENCE TERMINAL</div>
                <div className="text-[9px] text-muted/60 max-w-[240px] leading-relaxed">
                  Ask about any ticker, market trends, or recent news. Use $TICKER to reference specific stocks.
                </div>
                <div className="flex flex-wrap gap-1 mt-4 justify-center">
                  {["What's the sentiment on $AAPL?", "Show me danger tickers", "Market summary"].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="text-[9px] px-2 py-1 border border-card-border text-muted hover:text-accent hover:border-accent/30 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {streaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start mb-3">
                <div className="px-3 py-2 border-l-2 border-card-border bg-card-bg text-[11px] text-muted">
                  <span className="animate-pulse">ANALYZING...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-card-border shrink-0">
            <div className="flex items-center">
              <span className="text-accent text-[10px] pl-3 shrink-0">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any ticker or market..."
                disabled={streaming}
                className="flex-1 bg-transparent text-xs text-foreground py-3 px-2 focus:outline-none placeholder:text-muted/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="px-3 py-3 text-[10px] text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 shrink-0"
              >
                SEND
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
