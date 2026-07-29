"use client";
import { useState, useEffect } from "react";

export default function WorkExperiencePage() {
  const [resumeData, setResumeData] = useState({});
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("resumeData")) || {};
    setResumeData(d);
    setJobs(d.workExperience || []);
  }, []);

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
