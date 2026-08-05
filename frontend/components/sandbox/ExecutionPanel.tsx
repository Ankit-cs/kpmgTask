// @ts-nocheck
import React from "react";
import { Button } from "../ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface ExecutionPanelProps {
  code: string;
  language: string;
  onLanguageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  input: string;
  onInputChange: (input: string) => void;
  output: any;
  loading: boolean;
  onExecute: () => void;
  isVisualizing: boolean;
  onToggleVisualizer: () => void;
}

export function ExecutionPanel({
  code,
  language,
  onLanguageChange,
  input,
  onInputChange,
  output,
  loading,
  onExecute,
  isVisualizing,
  onToggleVisualizer,
}: ExecutionPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<any>(null);

  // Clear analysis when new output comes in
  React.useEffect(() => {
    setAiAnalysis(null);
  }, [output]);

  const handleAiFix = async () => {
    if (!output?.stderr && !output?.error) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("http://localhost:3000/api/analyze-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          stderr: output.stderr || output.error,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (e) {
      console.error(e);
      setAiAnalysis({ type: "Error", suggestion: "Failed to connect to AI service." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col z-10 bg-[#09090b]/60 backdrop-blur-md">


      <div className="flex-1 overflow-auto p-5 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={onLanguageChange}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="nodejs">Node.js</option>
            <option value="c">C</option>
            <option value="go">Go</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/40 mb-2">
            Custom Input
          </label>
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            rows={4}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-white/30 transition-colors"
            placeholder="Enter custom input here..."
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onExecute}
            disabled={loading || isVisualizing}
            className="flex-1 h-11 bg-[#EDFF66] hover:bg-[#d9ec4d] text-[#050507] font-black tracking-[0.09em] uppercase text-xs rounded-lg transition-all"
          >
            {loading ? "Executing..." : "Run Code"}
          </Button>
          <Button
            onClick={onToggleVisualizer}
            className="flex-1 h-11 bg-transparent border border-white/20 hover:bg-white/5 text-black font-black tracking-[0.09em] uppercase text-xs rounded-lg transition-all"
          >
            {isVisualizing ? "Close Visualizer" : "Visualize"}
          </Button>
        </div>

        {output && (
          <div className="mt-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Output
            </label>
            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 space-y-2">
              {output.error && (
                <div className="relative group mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-red-400 font-bold text-xs uppercase">Error</span>
                    {!output.stderr && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleAiFix} 
                        disabled={isAnalyzing}
                        className="h-6 text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        AI Fix
                      </Button>
                    )}
                  </div>
                  <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                    {output.error}
                  </pre>
                  
                  {!output.stderr && aiAnalysis && (
                    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold text-indigo-300">AI Analysis</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                        <div><span className="text-zinc-500">Type:</span> <span className="text-zinc-300">{aiAnalysis.type}</span></div>
                        <div><span className="text-zinc-500">Line:</span> <span className="text-zinc-300">{aiAnalysis.line || "Unknown"}</span></div>
                      </div>
                      <p className="text-sm text-zinc-300">{aiAnalysis.suggestion}</p>
                    </div>
                  )}
                </div>
              )}
              {output.status && (
                <div>
                  <span className="text-zinc-500 font-bold text-xs uppercase">Status</span>
                  <div className="text-sm font-mono text-zinc-300 mt-1">{output.status}</div>
                </div>
              )}
              {output.stdout && (
                <div>
                  <span className="text-zinc-500 font-bold text-xs uppercase">Stdout</span>
                  <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap mt-1">
                    {output.stdout}
                  </pre>
                </div>
              )}
              {output.stderr && (
                <div className="relative group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-red-400 font-bold text-xs uppercase">Stderr</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleAiFix} 
                      disabled={isAnalyzing}
                      className="h-6 text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                    >
                      {isAnalyzing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      AI Fix
                    </Button>
                  </div>
                  <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                    {output.stderr}
                  </pre>
                  
                  {aiAnalysis && (
                    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold text-indigo-300">AI Analysis</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                        <div><span className="text-zinc-500">Type:</span> <span className="text-zinc-300">{aiAnalysis.type}</span></div>
                        <div><span className="text-zinc-500">Line:</span> <span className="text-zinc-300">{aiAnalysis.line || "Unknown"}</span></div>
                      </div>
                      <p className="text-sm text-zinc-300">{aiAnalysis.suggestion}</p>
                    </div>
                  )}
                </div>
              )}
              {output.time !== undefined && (
                <div>
                  <span className="text-zinc-500 font-bold text-xs uppercase">Execution Time</span>
                  <div className="text-sm font-mono text-zinc-300 mt-1">{output.time} ms</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
