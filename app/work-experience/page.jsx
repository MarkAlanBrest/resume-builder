"use client";
import { useState, useEffect } from "react";

export default function WorkExperiencePage() {
  const [resumeData, setResumeData] = useState({});
  const [jobs, setJobs] = useState([]);
  const [assignmentEntries, setAssignmentEntries] = useState([]);
  const [importedIdxs, setImportedIdxs] = useState(new Set());

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("resumeData")) || {};
    setResumeData(d);
    setJobs(d.workExperience || []);

    const saved = JSON.parse(localStorage.getItem("employerAssignment") || "[]");
    setAssignmentEntries(saved);
  }, []);

  function importAssignmentEntry(entry) {
    const newJob = {
      employer: entry.employer || "",
      title:    entry.title    || "",
      start:    entry.start    || "",
      end:      entry.end      || "",
      tasks:    entry.tasks    || "",
    };
    setJobs(prev => [...prev, newJob]);
    setImportedIdxs(prev => new Set([...prev, entry.employer + entry.title]));
  }

  function addJob() {
    setJobs([
      ...jobs,
      { employer: "", title: "", start: "", end: "", tasks: "" }
    ]);
  }

  function updateJob(i, field, value) {
    const updated = [...jobs];
    updated[i][field] = value;
    setJobs(updated);
  }

  function saveAndContinue() {
    const updated = {
      ...resumeData,
      workExperience: jobs
    };

    localStorage.setItem("resumeData", JSON.stringify(updated));
    window.location.href = "/finalize";
  }

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Work Experience</h1>

      {assignmentEntries.length > 0 && (
        <div style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          padding: "18px 22px",
          marginBottom: "28px",
        }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e40af", marginBottom: "6px" }}>
            📋 Employer Assignment — Available to Import
          </div>
          <div style={{ fontSize: "13px", color: "#374151", marginBottom: "14px" }}>
            You completed the Employers Assignment. Import your entries below — no retyping needed.
          </div>
          {assignmentEntries.map((entry, i) => {
            const key = entry.employer + entry.title;
            const done = importedIdxs.has(key);
            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "white",
                border: "1px solid #dbeafe",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "8px",
                gap: "12px",
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{entry.title}</span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}> at {entry.employer}</span>
                  {entry.grade && (
                    <span style={{
                      marginLeft: "10px",
                      background: "#dcfce7",
                      color: "#15803d",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "20px",
                    }}>
                      Grade: {entry.grade}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => importAssignmentEntry(entry)}
                  disabled={done}
                  style={{
                    background: done ? "#f3f4f6" : "#1e40af",
                    color: done ? "#9ca3af" : "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: done ? "default" : "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {done ? "✓ Imported" : "Import"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {jobs.map((job, i) => (
        <div
          key={i}
          style={{
            padding: "20px",
            border: "1px solid #ccc",
            marginBottom: "20px",
            borderRadius: "6px"
          }}
        >
          <input
            placeholder="Employer"
            value={job.employer}
            onChange={(e) => updateJob(i, "employer", e.target.value)}
          />

          <input
            placeholder="Job Title"
            value={job.title}
            onChange={(e) => updateJob(i, "title", e.target.value)}
          />

          <input
            placeholder="Start Date"
            value={job.start}
            onChange={(e) => updateJob(i, "start", e.target.value)}
          />

          <input
            placeholder="End Date"
            value={job.end}
            onChange={(e) => updateJob(i, "end", e.target.value)}
          />

          <textarea
            placeholder="Tasks / Responsibilities"
            value={job.tasks}
            onChange={(e) => updateJob(i, "tasks", e.target.value)}
          />
        </div>
      ))}

      <button onClick={addJob} style={{ marginRight: "20px" }}>
        Add Job
      </button>

      <button onClick={saveAndContinue}>Save & Continue</button>
    </div>
  );
}
