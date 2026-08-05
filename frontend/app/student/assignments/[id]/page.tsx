"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { ExecutionPanel } from "../../../../components/sandbox/ExecutionPanel";
import { WorkspacePanel } from "../../../../components/sandbox/WorkspacePanel";
import { Button } from "../../../../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AssignmentSandboxPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);

  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const defaultSnippets: Record<string, string> = {
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello Sandbox!" << std::endl;\n    return 0;\n}',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello Sandbox!");\n    }\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello Sandbox!\\n");\n    return 0;\n}',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello Sandbox!")\n}',
    nodejs: 'console.log("Hello Sandbox!");',
    python: 'print("Hello Sandbox!")',
  };

  const [snippets, setSnippets] = useState<Record<string, string>>(defaultSnippets);

  useEffect(() => {
    async function fetchAssignment() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/assignments/${assignmentId}`);
        if (res.ok) {
          const data = await res.json();
          setAssignment(data);
        }
      } catch (e) {
        console.error("Failed to fetch assignment", e);
      } finally {
        setLoadingAssignment(false);
      }
    }
    fetchAssignment();

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

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [assignmentId]);

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

  const handleSubmit = async () => {
    // Coming soon!
    alert("Submit functionality coming soon!");
  };

  if (loadingAssignment) {
    return <div className="flex h-screen items-center justify-center bg-[#050507] text-white">Loading...</div>;
  }

  if (!assignment) {
    return <div className="flex h-screen items-center justify-center bg-[#050507] text-white">Assignment not found</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#050507] text-white font-inter relative overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#09090b]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/student/assignments")}>
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Button>
          <h1 className="text-lg font-bold">{assignment.title}</h1>
        </div>
        <div>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-black font-bold h-8"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] w-full relative z-10">
        
        {/* Left Column: Description + Execution Panel */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-1/3 h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col"
        >
          <div className="p-6 border-b border-white/10 bg-[#09090b]">
            <h2 className="text-sm font-black tracking-widest uppercase text-white/90 mb-4">Description</h2>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
            
            {assignment.constraints && (
              <div className="mt-6">
                <h2 className="text-sm font-black tracking-widest uppercase text-white/90 mb-4">Constraints</h2>
                <div className="bg-[#1e1e24] p-4 rounded-md border border-white/10">
                  <p className="text-zinc-300 text-sm font-mono whitespace-pre-wrap">{assignment.constraints}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-hidden">
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
          </div>
        </motion.div>

        {/* Right Column: Code Canvas */}
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
