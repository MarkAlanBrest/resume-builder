"use client";
import { useState, useEffect } from "react";

export default function SkillsPage() {
  const [resumeData, setResumeData] = useState({});
  const [skills, setSkills] = useState("");

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("resumeData")) || {};
    setResumeData(d);
    setSkills(d.certifications?.extraSkills || "");
  }, []);

  function saveAndContinue() {
    const updated = {
      ...resumeData,
      certifications: {
        ...resumeData.certifications,
        extraSkills: skills
      }
    };

    localStorage.setItem("resumeData", JSON.stringify(updated));
    window.location.href = "/finalize";
  }

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Skills</h1>

      <textarea
        placeholder="List your skills"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        style={{ width: "100%", height: "120px", marginBottom: "20px" }}
      />

      <button onClick={saveAndContinue}>Save & Continue</button>
    </div>
  );
}
