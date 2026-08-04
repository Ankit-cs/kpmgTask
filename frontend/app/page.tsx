"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { NQueensCanvas } from "../components/animations/ComplexAnimations";
import CustomCursor from "../components/common/CustomCursor";
import { ExecutionPanel } from "../components/sandbox/ExecutionPanel";
import { WorkspacePanel } from "../components/sandbox/WorkspacePanel";

export default function SandboxTestPage() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(
    '#include <iostream>\n\nint main() {\n    std::cout << "Hello Sandbox!" << std::endl;\n    return 0;\n}'
  );
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);

  const defaultSnippets: Record<string, string> = {
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello Sandbox!" << std::endl;\n    return 0;\n}',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello Sandbox!");\n    }\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello Sandbox!\\n");\n    return 0;\n}',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello Sandbox!")\n}',
    nodejs: 'console.log("Hello Sandbox!");',
    python: 'print("Hello Sandbox!")',
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(defaultSnippets[lang]);
  };

  const handleExecute = async () => {
    setLoading(true);
    setOutput(null);
    try {
      const res = await fetch("http://localhost:3001/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input }),
      });
      const data = await res.json();
      
      if (res.status === 202 && data.jobId) {
        // Polling loop
        const jobId = data.jobId;
        const intervalId = setInterval(async () => {
          try {
            const pollRes = await fetch(`http://localhost:3001/api/execute/${jobId}`);
            const pollData = await pollRes.json();
            
            if (pollData.status === "completed") {
              clearInterval(intervalId);
              setOutput(pollData.result);
              setLoading(false);
            } else if (pollData.status === "failed") {
              clearInterval(intervalId);
              setOutput({ error: pollData.error });
              setLoading(false);
            }
            // If "waiting" or "active", keep polling
          } catch (e) {
            clearInterval(intervalId);
            setOutput({ error: "Failed to poll job status" });
            setLoading(false);
          }
        }, 2000); // Poll every 2 seconds
      } else {
        setOutput(data);
        setLoading(false);
      }
    } catch (err: any) {
      setOutput({ error: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050507] text-white font-inter cursor-none relative overflow-hidden">
      <CustomCursor />
      <div className="absolute inset-0 pointer-events-none z-0">
        <NQueensCanvas size={8} color="#EDFF66" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050507]/90 via-[#050507]/60 to-[#050507]/90 mix-blend-multiply" />
      </div>

      <div className="flex flex-col lg:flex-row h-full w-full relative z-10">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-1/3 h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10"
        >
          <ExecutionPanel
            language={language}
            onLanguageChange={handleLanguageChange}
            input={input}
            onInputChange={setInput}
            output={output}
            loading={loading}
            onExecute={handleExecute}
            isVisualizing={isVisualizing}
            onToggleVisualizer={() => setIsVisualizing(!isVisualizing)}
          />
        </motion.div>

        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-2/3 h-[50vh] lg:h-full"
        >
          <WorkspacePanel
            isVisualizing={isVisualizing}
            code={code}
            onCodeChange={setCode}
            language={language}
            output={output}
          />
        </motion.div>
      </div>
    </div>
  );
}
