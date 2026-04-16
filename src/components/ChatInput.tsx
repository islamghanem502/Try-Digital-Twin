import { Send, Sparkles, Bot } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSimulate: (prompt: string) => void;
  isSimulating: boolean;
}

const ChatInput = ({ onSimulate, isSimulating }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSimulate(input.trim());
    setInput("");
  };

  return (
    <div className="h-full bg-card rounded-2xl shadow-card flex flex-col overflow-hidden border border-primary/10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles size={15} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-semibold text-foreground leading-none">
            {isSimulating ? "Simulation Active" : "AI What-If Analysis"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Simulate real-time health scenarios</p>
        </div>
        {isSimulating && (
          <button
            onClick={() => onSimulate("")}
            className="text-xs px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-full transition-colors font-medium shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* Messages area — grows to fill space */}
      <div className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-2 min-h-0">
        {isSimulating ? (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-foreground leading-relaxed max-w-[85%]">
              Simulation results are now reflected in the health cards on the right. Try another scenario or reset to baseline.
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={22} className="text-primary/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Ask the AI</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[180px] mx-auto">
                Type a what-if question to simulate health outcomes
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {["Lose 10kg", "Exercise daily", "Quit sugar"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(`What if I ${s.toLowerCase()}?`); }}
                  className="text-xs px-3 py-1.5 bg-secondary border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input pinned to bottom */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex items-center gap-2 bg-secondary/60 rounded-xl border border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. What if I lose 10kg?"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

