"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRole } from "../../../../../components/RoleProvider";

export default function EditAssignmentPage() {
  const { role } = useRole();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", expectedOut: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // If not teacher, redirect
  useEffect(() => {
    if (role !== "TEACHER") {
      router.push("/");
    }
  }, [role, router]);

  useEffect(() => {
    async function fetchAssignment() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/assignments/${assignmentId}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title || "");
          setDescription(data.description || "");
          setConstraints(data.constraints || "");
          if (data.testCases && data.testCases.length > 0) {
            setTestCases(data.testCases.map((tc: any) => ({
              input: tc.input || "",
              expectedOut: tc.expectedOut || ""
            })));
          }
        } else {
          alert("Failed to load assignment details.");
          router.push("/teacher/assignments");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignment();
  }, [assignmentId, router]);

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOut: "" }]);
  };

  const handleTestCaseChange = (index: number, field: "input" | "expectedOut", value: string) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleRemoveTestCase = (index: number) => {
    const updated = [...testCases];
    updated.splice(index, 1);
    setTestCases(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, constraints, testCases })
      });
      
      if (res.ok) {
        alert("Assignment updated successfully!");
        router.push("/teacher/assignments");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update assignment");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating assignment");
    } finally {
      setSaving(false);
    }
  };

  if (role !== "TEACHER") return null;

  if (loading) {
    return <div className="min-h-screen bg-[#050507] text-white p-8 flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#EDFF66] mb-8">Edit Assignment</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1e1e24] p-6 rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Problem Details</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#0a0a0f] border border-white/20 rounded p-3 focus:outline-none focus:border-[#EDFF66]"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Two Sum"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description (Markdown supported)</label>
              <textarea 
                required
                className="w-full bg-[#0a0a0f] border border-white/20 rounded p-3 h-32 focus:outline-none focus:border-[#EDFF66]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the problem..."
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">Constraints</label>
              <textarea 
                required
                className="w-full bg-[#0a0a0f] border border-white/20 rounded p-3 h-24 focus:outline-none focus:border-[#EDFF66]"
                value={constraints}
                onChange={e => setConstraints(e.target.value)}
                placeholder="e.g. 1 <= nums.length <= 10^4"
              />
            </div>
          </div>

          <div className="bg-[#1e1e24] p-6 rounded-lg border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Test Cases</h2>
              <button 
                type="button"
                onClick={handleAddTestCase}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors"
              >
                + Add Test Case
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              Note: Test case inputs and outputs will be automatically securely pushed to Cloudflare KV for the execution sandbox.
            </p>

            <div className="space-y-4">
              {testCases.map((tc, index) => (
                <div key={index} className="flex gap-4 items-start bg-[#0a0a0f] p-4 rounded border border-white/5">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Input (stdin)</label>
                    <textarea 
                      required
                      className="w-full bg-[#1e1e24] border border-white/10 rounded p-2 h-20 focus:outline-none focus:border-purple-400 font-mono text-sm"
                      value={tc.input}
                      onChange={e => handleTestCaseChange(index, "input", e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Expected Output (stdout)</label>
                    <textarea 
                      required
                      className="w-full bg-[#1e1e24] border border-white/10 rounded p-2 h-20 focus:outline-none focus:border-green-400 font-mono text-sm"
                      value={tc.expectedOut}
                      onChange={e => handleTestCaseChange(index, "expectedOut", e.target.value)}
                    />
                  </div>
                  {testCases.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveTestCase(index)}
                      className="mt-6 text-red-500 hover:text-red-400 p-2"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => router.push("/teacher/assignments")}
              className="bg-white/10 text-white font-bold py-3 px-8 rounded hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="bg-[#EDFF66] text-black font-bold py-3 px-8 rounded hover:bg-[#d4e65c] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
