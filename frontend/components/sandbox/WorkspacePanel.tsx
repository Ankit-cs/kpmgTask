import React from "react";
import { CodeEditor } from "../CodeEditor";
import VisualizerShell from "../visualizer/VisualizerShell";
import ControlBar from "../visualizer/ControlBar";
import CodePanel from "../visualizer/CodePanel";

import ExplanationLog from "../visualizer/ExplanationLog";

interface WorkspacePanelProps {
  isVisualizing: boolean;
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  output?: any;
}

export function WorkspacePanel({
  isVisualizing,
  code,
  onCodeChange,
  language,
  output,
}: WorkspacePanelProps) {
  // Convert raw code string to Visualizer CodePanel format
  const codeLines = code.split('\n').map((line, i) => ({
    n: i + 1,
    tokens: [{ t: line, k: "" }]
  }));

  return (
    <div className="flex-1 flex flex-col z-10 bg-[#1e1e1e]">
      {isVisualizing ? (
        <VisualizerShell>
          <div className="flex flex-col h-full gap-4">
            <ControlBar 
              loaded={true} 
              playing={false} 
              step={0} 
              totalSteps={1} 
              speed={100} 
              onRun={() => {}} 
              onReset={() => {}} 
              onForward={() => {}} 
              onBackward={() => {}} 
              onPlayPause={() => {}} 
              setSpeed={() => {}} 
            />
            <div className="flex-1 flex gap-4 overflow-hidden">
              <div className="w-[45%] flex flex-col h-full bg-[#050507] border border-white/10 rounded-lg overflow-hidden">
                <CodePanel lines={codeLines} activeLine={1} />
              </div>
              <div className="flex-1 border border-white/10 rounded-lg bg-[#050507] flex flex-col relative overflow-hidden">
                {output ? (
                  <ExplanationLog
                     logs={[
                       { title: "Execution Status", text: output.exitCode === 0 ? "Success" : "Error" },
                       { title: "Output", text: output.stdout || output.stderr || "No output" },
                       ...(output.codeFeedback ? [{ title: "AI Feedback", text: output.codeFeedback, k: "fn" }] : [])
                     ]}
                     activeLogIndex={-1}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <span className="text-white/40 font-mono text-sm z-10">Run code to see visualizations</span>
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div className="w-full h-full border-[0.5px] border-white/20 grid grid-cols-6 grid-rows-6">
                        {Array.from({ length: 36 }).map((_, i) => <div key={i} className="border-[0.5px] border-white/20"></div>)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </VisualizerShell>
      ) : (
        <div className="flex-1 p-0">
          <CodeEditor
            code={code}
            onChange={(val) => onCodeChange(val || "")}
            language={language}
          />
        </div>
      )}
    </div>
  );
}
