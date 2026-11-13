import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface KilnChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  telemetryContext: unknown;
}

const QUICK_PROMPTS = [
  'Summarize open thermal advisories',
  'Energy cost breakdown in INR',
  'Which silos need a restock PO?',
  'Status of Batch B-4092 & TK-01',
];

export const KilnChatbot: React.FC<KilnChatbotProps> = ({
  isOpen,
  onToggle,
  telemetryContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Kiln AI Copilot online. Ask about live zone temperatures, batch yields, refractory wear, or Indian Rupee (₹) energy costs across your kilns.',
      timestamp: 'Ready',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const now = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: now,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory
            .filter((m) => !m.isError && m.id !== 'welcome-msg')
            .map((m) => ({ role: m.role, content: m.content })),
          telemetryContext,
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Assistant service returned an error.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply!,
          timestamp: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach Kiln AI Copilot.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: msg,
          timestamp: 'Error',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Open Kiln AI Assistant"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-md bg-[#2563eb] hover:bg-[#0051d5] text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer whitespace-nowrap"
      >
        <Sparkles className="w-4 h-4" />
        <span>Kiln AI Copilot</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Kiln AI Copilot Chatbot"
      className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[410px] h-[540px] max-h-[82vh] bg-white border border-slate-300 rounded-md shadow-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#0b1c30] text-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-[#2563eb] flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-display font-semibold truncate">Kiln AI Copilot</div>
            <div className="text-[11px] text-slate-300 truncate">
              Live Telemetry & INR Cost Assistant
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close Kiln AI Copilot"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-[#eff4ff] border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage(q)}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-[#2563eb] text-[11px] font-medium text-[#0b1c30] rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9ff]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-md px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#9f3c16] text-white'
                    : msg.isError
                    ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30'
                    : 'bg-white text-[#0b1c30] border border-slate-200'
                }`}
              >
                {msg.content}
              </div>
              <span className="mt-1 text-[10px] font-mono tabular-nums text-slate-400">
                {isUser ? 'Operator' : 'Kiln AI'} · {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white border border-slate-200 rounded-md px-3.5 py-2.5 text-xs text-[#2563eb] font-medium">
              Analyzing kiln telemetry...
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about zones, yield, or ₹ costs..."
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-[#0b1c30] focus:outline-none focus:border-[#2563eb]"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
          className="px-3 py-2 bg-[#2563eb] hover:bg-[#0051d5] disabled:opacity-45 text-white rounded-md transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};
