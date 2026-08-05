// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";

import { ExecutionPanel } from "../components/sandbox/ExecutionPanel";
import { WorkspacePanel } from "../components/sandbox/WorkspacePanel";

export default function SandboxTestPage() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const defaultSnippets: Record<string, string> = {
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello Sandbox!" << std::endl;\n    return 0;\n}',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello Sandbox!");\n    }\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello Sandbox!\\n");\n    return 0;\n}',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello Sandbox!")\n}',
    nodejs: 'console.log("Hello Sandbox!");',
    python: 'print("Hello Sandbox!")',
  };

  const [snippets, setSnippets] = useState<Record<string, string>>(defaultSnippets);

  React.useEffect(() => {
    const saved = localStorage.getItem("user_templates");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSnippets(parsed);
        setCode(parsed[language] || defaultSnippets[language]);
      } catch (e) {
        setCode(defaultSnippets[language]);
      }
    } else {
      setCode(defaultSnippets[language]);
    }
  }, []);

  const handleSaveTemplate = () => {
    const newSnippets = { ...snippets, [language]: code };
    setSnippets(newSnippets);
    localStorage.setItem("user_templates", JSON.stringify(newSnippets));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(snippets[lang] || defaultSnippets[lang]);
  };

  const handleExecute = async () => {
    if (!socket) return;
    setLoading(true);
    setOutput(null);
    
    // Set up a one-time listener for this execution
    const tempListener = (data: any) => {
      if (data.jobId) {
        socket.once(`job_completed_${data.jobId}`, (res: any) => {
          setOutput(res.result);
          setLoading(false);
        });
        socket.once(`job_failed_${data.jobId}`, (res: any) => {
          setOutput({ error: res.error || "Execution failed" });
          setLoading(false);
        });
      }
    };
    
    socket.once('job_queued', tempListener);
    socket.once('execution_error', (res: any) => {
      setOutput({ error: res.error });
      setLoading(false);
    });

    socket.emit('execute_code', { language, code, input });
  };

  return (
    <div className="flex h-screen bg-[#050507] text-white font-inter relative overflow-hidden">

      <div className="flex flex-col lg:flex-row h-full w-full relative z-10">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-1/3 h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10"
        >
          <ExecutionPanel
            code={code}
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
          className="w-full lg:w-2/3 h-[50vh] lg:h-full p-4"
        >
          <WorkspacePanel
            isVisualizing={isVisualizing}
            code={code}
            onCodeChange={setCode}
            language={language}
            output={output}
            onSaveTemplate={handleSaveTemplate}
          />
        </motion.div>
      </div>
    </div>
  );
}
