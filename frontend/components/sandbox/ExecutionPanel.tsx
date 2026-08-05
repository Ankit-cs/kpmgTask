// @ts-nocheck
import React from "react";
import { Button } from "../ui/button";

interface ExecutionPanelProps {
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
  return (
    <div className="w-full h-full flex flex-col z-10 bg-[#09090b]/60 backdrop-blur-md">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#EDFF66] flex items-center justify-center text-[#050507] font-black text-xl">
            V
          </div>
          <h1 className="text-sm font-black tracking-widest uppercase text-white/90">LMS Sandbox</h1>
        </div>
      </div>

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
                <div>
                  <span className="text-red-400 font-bold text-xs uppercase">Error</span>
                  <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap mt-1">
                    {output.error}
                  </pre>
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
                <div>
                  <span className="text-red-400 font-bold text-xs uppercase">Stderr</span>
                  <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap mt-1">
                    {output.stderr}
                  </pre>
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
