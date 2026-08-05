// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRole } from "../../components/RoleProvider";
import { useRouter } from "next/navigation";

export default function TeacherPortal() {
  const { role } = useRole();
  const router = useRouter();
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (role !== "TEACHER") {
      router.push("/");
      return;
    }
    fetchPendingDrafts();
  }, [role, router]);

  const fetchPendingDrafts = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/doubts/pending`);
      const data = await res.json();
      setPendingDrafts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, customContent?: string) => {
    try {
      // In a real app we would send the edited content to be saved as well
      // But for this simple implementation, we'll just approve the draft
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/doubts/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setEditingId(null);
        fetchPendingDrafts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/doubts/${id}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        fetchPendingDrafts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (role !== "TEACHER") return null;

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400">Teacher Review Portal</h1>
          <button 
            onClick={fetchPendingDrafts}
            className="text-sm bg-[#1e1e24] px-4 py-2 rounded hover:bg-[#2a2a32] transition-colors"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading pending drafts...</div>
        ) : pendingDrafts.length === 0 ? (
          <div className="bg-[#0a0a0f] border border-white/10 rounded-lg p-10 text-center text-gray-400">
            No pending AI drafts to review. Good job!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingDrafts.map((draft) => (
              <div key={draft.id} className="bg-[#0a0a0f] border border-purple-500/30 rounded-lg overflow-hidden">
                <div className="bg-purple-900/20 p-4 border-b border-purple-500/30 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">
                      Pending AI Draft Review
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(draft.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-sm text-gray-500 mb-1">Student's Doubt:</h3>
                    <div className="text-lg bg-[#1e1e24] p-4 rounded border border-white/5">
                      {draft.doubt.content}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">AI Generated Draft:</h3>
                    
                    {editingId === draft.id ? (
                      <div className="space-y-4">
                        <textarea
                          className="w-full h-64 bg-[#1e1e24] text-gray-300 p-4 border border-purple-500/50 rounded font-mono text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                        />
                        <div className="flex gap-3 justify-end">
                          <button 
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                          >
                            Cancel Edit
                          </button>
                          <button 
                            onClick={() => handleApprove(draft.id, editedContent)}
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50 px-6 py-2 rounded text-sm font-bold transition-colors"
                          >
                            Approve Edited Version
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="prose prose-invert max-w-none bg-[#1e1e24] p-4 rounded border border-white/5 mb-4">
                          <ReactMarkdown>{draft.content}</ReactMarkdown>
                        </div>
                        
                        <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-white/10">
                          <button 
                            onClick={() => handleReject(draft.id)}
                            className="px-6 py-2 rounded text-sm font-bold text-red-400 hover:bg-red-950 transition-colors border border-transparent hover:border-red-900"
                          >
                            Reject & Discard
                          </button>
                          <button 
                            onClick={() => {
                              setEditingId(draft.id);
                              setEditedContent(draft.content);
                            }}
                            className="bg-[#1e1e24] hover:bg-[#2a2a32] border border-white/10 px-6 py-2 rounded text-sm font-bold transition-colors"
                          >
                            Edit Draft
                          </button>
                          <button 
                            onClick={() => handleApprove(draft.id)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded text-sm font-bold transition-colors shadow-lg shadow-purple-900/20"
                          >
                            Approve As Is
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
