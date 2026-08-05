// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { useRole } from "../../../components/RoleProvider";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function StudentHistoryPage() {
  const { role } = useRole();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    if (role !== "STUDENT") {
      router.push("/");
      return;
    }
    fetchHistory();
  }, [role, router]);

  const fetchHistory = async () => {
    try {
      // Hardcoded student email matching the backend executor logic
      const res = await fetch("http://localhost:3000/api/submissions/student/student@example.com");
      const data = await res.json();
      setSubmissions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (role !== "STUDENT") return null;

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8">
      <div className="max-w-6xl mx-auto flex gap-8">
        
        {/* Left Column: History List */}
        <div className="w-1/3">
          <h1 className="text-2xl font-bold text-[#EDFF66] mb-6">My Submissions</h1>
          
          {loading ? (
            <div className="text-gray-500">Loading history...</div>
          ) : submissions.length === 0 ? (
            <div className="bg-[#1e1e24] p-6 rounded-lg border border-white/10 text-gray-400">
              You haven't submitted any code yet.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div 
                  key={sub.id} 
                  onClick={() => setSelectedSubmission(sub)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSubmission?.id === sub.id 
                      ? "bg-[#1e1e24] border-[#EDFF66]" 
                      : "bg-[#0a0a0f] border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{sub.assignment.title}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      sub.status === "Success" ? "bg-green-900/50 text-green-400" :
                      sub.status === "Compilation Error" ? "bg-yellow-900/50 text-yellow-400" :
                      "bg-red-900/50 text-red-400"
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{sub.language.toUpperCase()}</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Submission Details */}
        <div className="w-2/3">
          {selectedSubmission ? (
            <div className="bg-[#1e1e24] rounded-lg border border-white/10 overflow-hidden flex flex-col h-[calc(100vh-100px)]">
              
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0a0a0f]">
                <h2 className="text-xl font-bold">{selectedSubmission.assignment.title}</h2>
                <div className="text-sm text-gray-400">{new Date(selectedSubmission.createdAt).toLocaleString()}</div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Code Viewer */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Submitted Code</h3>
                  <div className="bg-[#050507] p-4 rounded border border-white/5 font-mono text-sm overflow-x-auto">
                    <pre><code>{selectedSubmission.code}</code></pre>
                  </div>
                </div>

                {/* AI Feedback */}
                {selectedSubmission.codeFeedback && (
                  <div>
                    <h3 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      ✨ AI Code Review
                    </h3>
                    <div className="bg-purple-900/10 p-6 rounded border border-purple-500/20">
                      {(() => {
                        try {
                          // Try to parse the JSON output from the new Zod schema
                          const fb = JSON.parse(selectedSubmission.codeFeedback);
                          return (
                            <div className="space-y-4">
                              <div className="flex gap-4">
                                <div className="bg-[#0a0a0f] p-3 rounded border border-white/5 flex-1 text-center">
                                  <div className="text-xs text-gray-500 uppercase mb-1">Score</div>
                                  <div className="text-2xl font-bold text-[#EDFF66]">{fb.score}/10</div>
                                </div>
                                <div className="bg-[#0a0a0f] p-3 rounded border border-white/5 flex-1 text-center">
                                  <div className="text-xs text-gray-500 uppercase mb-1">Complexity</div>
                                  <div className="text-lg font-mono text-blue-400 mt-1">{fb.complexity}</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-400 mb-1">Feedback:</div>
                                <div className="prose prose-invert max-w-none text-sm">
                                  <ReactMarkdown>{fb.feedback}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          // Fallback for old string feedback
                          return (
                            <div className="prose prose-invert max-w-none text-sm">
                              <ReactMarkdown>{selectedSubmission.codeFeedback}</ReactMarkdown>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Execution Ledger */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Execution Ledger (Docker Sandbox)</h3>
                  <div className="bg-[#050507] p-4 rounded border border-white/5 space-y-2 text-sm font-mono text-gray-300">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Exit Code:</span>
                      <span className={selectedSubmission.executionLedger.exitCode === 0 ? "text-green-400" : "text-red-400"}>
                        {selectedSubmission.executionLedger.exitCode}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span>Execution Time:</span>
                      <span>{selectedSubmission.executionLedger.time}ms</span>
                    </div>
                    {selectedSubmission.executionLedger.stdout && (
                      <div className="pt-2">
                        <span className="text-gray-500 block mb-1">STDOUT:</span>
                        <pre className="text-green-400 whitespace-pre-wrap">{selectedSubmission.executionLedger.stdout}</pre>
                      </div>
                    )}
                    {selectedSubmission.executionLedger.stderr && (
                      <div className="pt-2">
                        <span className="text-gray-500 block mb-1">STDERR:</span>
                        <pre className="text-red-400 whitespace-pre-wrap">{selectedSubmission.executionLedger.stderr}</pre>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg text-gray-500">
              Select a submission to view details
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
