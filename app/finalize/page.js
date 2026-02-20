"use client";

import { useState } from "react";

export default function FinalizePage() {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Template");
  const [confirmed, setConfirmed] = useState(false);

  async function generateResume() {
    if (!confirmed) return;

    setLoading(true);

    const data = JSON.parse(localStorage.getItem("resumeData")) || {};

    const payload = {
      TEMPLATE: selectedTemplate,

      // STUDENT INFO
      student: {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        programCampus: data.programCampus || "",
        graduationDate: data.grad || ""
      },

      // CAREER CONTEXT
      careerContext: data.careerContext || {
        jobInterest: "",
        personalQualities: [],
        additionalSoftSkills: ""
      },

      // WORK + MILITARY
      workExperience: data.workExperience || [],
      militaryService: data.militaryService || [],

      // EDUCATION
      education: data.education || [],

      // CERTIFICATIONS + SKILLS
      certifications: data.certifications || {
        programCertsSelected: [],
        extraCerts: "",
        extraSkills: ""
      }
    };

    const res = await fetch("/api/generateResume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.docx";
    a.click();
    window.URL.revokeObjectURL(url);

    setLoading(false);
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial", maxWidth: "600px" }}>
      <h1>Finalize Resume</h1>
      <p>Your resume is almost ready.</p>

      <h3>Select a Template</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["Template", "TemplateA", "TemplateB", "TemplateC"].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTemplate(t)}
            style={{
              padding: "10px",
              border: selectedTemplate === t ? "3px solid blue" : "1px solid gray",
              cursor: "pointer",
              background: selectedTemplate === t ? "#e6f0ff" : "white"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <label style={{ display: "block", marginBottom: "20px" }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginRight: "8px" }}
        />
        I understand it is my responsibility to review and edit my resume before
        submitting it to my instructor in Canvas LMS.
      </label>

      <button
        onClick={generateResume}
        disabled={!confirmed || loading}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          cursor: confirmed && !loading ? "pointer" : "not-allowed",
          background: loading ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px"
        }}
      >
        {loading ? "Generating..." : "Download Resume"}
      </button>

      {loading && (
        <p style={{ color: "red", marginTop: "15px" }}>
          Your resume is being generated…
        </p>
      )}
    </div>
  );
}