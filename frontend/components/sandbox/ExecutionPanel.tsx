// @ts-nocheck
import React from "react";
import { Button } from "../ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface ExecutionPanelProps {
  code: string;
  language: string;
  input: string;
  onInputChange: (input: string) => void;
  output: any;
  loading: boolean;
  onExecute: (runInput: string) => void;
  isVisualizing: boolean;
  onToggleVisualizer: () => void;
  testCases?: { id: string; input: string; expectedOut: string }[];
}

export function ExecutionPanel({
  code,
  language,
  input,
  onInputChange,
  output,
  loading,
  onExecute,
  isVisualizing,
  onToggleVisualizer,
  testCases,
}: ExecutionPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<"testcases" | "custom">("testcases");
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = React.useState(0);

  // Clear analysis when new output comes in
  React.useEffect(() => {
    setAiAnalysis(null);
  }, [output]);

  const handleAiFix = async () => {
    if (!output?.stderr && !output?.error) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("http://localhost:5000/api/analyze-error", {
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

  const handleRunClick = () => {
    let runInput = input;
    if (activeTab === "testcases" && testCases && testCases.length > 0) {
      runInput = testCases[selectedTestCaseIndex].input;
    }
    onExecute(runInput);
  };

  return (
    <div className="w-full h-full flex flex-col z-10 bg-[#09090b]/60 backdrop-blur-md">
      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4">
        <button
          onClick={() => setActiveTab("testcases")}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === "testcases"
              ? "border-[#EDFF66] text-[#EDFF66]"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Test Cases
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === "custom"
              ? "border-[#EDFF66] text-[#EDFF66]"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Custom Input
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-6">
        {activeTab === "testcases" ? (
          <div>
            {testCases && testCases.length > 0 ? (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {testCases.map((tc, idx) => (
                    <button
                      key={tc.id || idx}
                      onClick={() => setSelectedTestCaseIndex(idx)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                        selectedTestCaseIndex === idx
                          ? "bg-white/10 text-white border border-white/20"
                          : "bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10"
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/40 mb-2">
                      Input
                    </label>
                    <div className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                      {testCases[selectedTestCaseIndex].input}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500 text-xs text-center py-8">
                No test cases available for this assignment.
              </div>
            )}
          </div>
        ) : (
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
        )}

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={handleRunClick}
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
