// @ts-nocheck
import React from "react";
import { CodeEditor } from "../CodeEditor";
import VisualizerShell from "../visualizer/VisualizerShell";
import ControlBar from "../visualizer/ControlBar";
import CodePanel from "../visualizer/CodePanel";
import { Button } from "../ui/button";
import { Save } from "lucide-react";
import ExplanationLog from "../visualizer/ExplanationLog";

interface WorkspacePanelProps {
  isVisualizing: boolean;
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  output?: any;
  onSaveTemplate: () => void;
}

export function WorkspacePanel({
  isVisualizing,
  code,
  onCodeChange,
  language,
  output,
  onSaveTemplate,
}: WorkspacePanelProps) {
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    onSaveTemplate();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  // Convert raw code string to Visualizer CodePanel format
  const codeLines = code.split('\n').map((line, i) => ({
    n: i + 1,
    tokens: [{ t: line, k: "" }]
  }));

  return (
    <div className="w-full h-full flex flex-col z-10 bg-[#09090b]/60 backdrop-blur-md rounded-xl overflow-hidden border border-white/10">
      {isVisualizing ? (
        <VisualizerShell>
          <div className="flex flex-col h-full gap-4 p-4">
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
              <div className="w-[45%] flex flex-col h-full bg-[#050507]/80 border border-white/10 rounded-lg overflow-hidden">
                <CodePanel lines={codeLines} activeLine={1} />
              </div>
              <div className="flex-1 border border-white/10 rounded-lg bg-[#050507]/80 flex flex-col relative overflow-hidden">
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
        <div className="w-full h-full p-4 relative">
          <div className="absolute top-6 right-8 z-20">
            <Button
              onClick={handleSave}
              size="sm"
              variant="outline"
              className={`h-8 text-xs transition-colors ${saved ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"}`}
            >
              <Save className="w-3.5 h-3.5 mr-2" />
              {saved ? "Template Saved!" : "Save as Template"}
            </Button>
          </div>
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
