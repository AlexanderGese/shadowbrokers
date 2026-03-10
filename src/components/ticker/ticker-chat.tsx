"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "../chat/chat-message";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function TickerChat({ ticker }: { ticker: string }) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat/ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          ticker,
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

  const suggestions = [
    `What's the outlook for ${ticker}?`,
    `Why is ${ticker} ${ticker === "SPY" ? "moving" : "in the news"}?`,
    `How accurate are predictions for ${ticker}?`,
    `Summarize recent sentiment`,
  ];

  return (
    <div className="border border-card-border bg-card-bg">
      {/* Toggle Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-card-border/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-accent text-xs">&gt;_</span>
          <span className="text-[10px] text-muted tracking-widest">ASK AI ABOUT {ticker}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted/50">GPT-4O-MINI</span>
          <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>
            {open ? "\u25B2" : "\u25BC"}
          </span>
        </div>
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="border-t border-card-border">
          {/* Messages Area */}
          <div className="h-[320px] overflow-y-auto p-4 scrollbar-hide">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-[10px] text-muted tracking-widest mb-1">{ticker} INTELLIGENCE</div>
                <div className="text-[9px] text-muted/60 max-w-[280px] leading-relaxed mb-4">
                  Ask anything about {ticker} — sentiment, news, predictions, price action, or company info.
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {suggestions.map((q) => (
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
                <div className="px-3 py-2 border-l-2 border-card-border bg-background text-[11px] text-muted">
                  <span className="animate-pulse">ANALYZING {ticker}...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-card-border">
            <div className="flex items-center">
              <span className="text-accent text-[10px] pl-3 shrink-0">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${ticker}...`}
                disabled={streaming}
                className="flex-1 bg-transparent text-xs text-foreground py-3 px-2 focus:outline-none placeholder:text-muted/40 disabled:opacity-50"
              />
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="text-[9px] text-muted hover:text-foreground transition-colors px-2"
                >
                  CLEAR
                </button>
              )}
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
    </div>
  );
}
