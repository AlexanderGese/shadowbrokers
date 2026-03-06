"use client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  // Highlight ticker symbols ($AAPL) and numbers
  const formatted = content.replace(
    /(\$[A-Z]{1,5}\b|(?<!\w)[A-Z]{2,5}(?=\s|[.,;:!?]|$))/g,
    '<span class="text-accent font-bold">$1</span>'
  ).replace(
    /(\d+\.?\d*%)/g,
    '<span class="text-foreground font-bold">$1</span>'
  );

  if (role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] px-3 py-2 border-r-2 border-accent bg-accent/5 text-[11px] text-foreground leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%] px-3 py-2 border-l-2 border-card-border bg-card-bg text-[11px] text-foreground leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: formatted }} />
      </div>
    </div>
  );
}
