"use client";

import { useState } from "react";

export default function FinalizePage() {
  const [loading, setLoading] = useState(false);

  async function generateResume() {
    setLoading(true);

    const data = JSON.parse(localStorage.getItem("resumeData")) || {};

    // Format EDUCATION array into printable text
    const formattedEducation = Array.isArray(data.education)
      ? data.education
          .map(e =>
            `${e.program || ""} — ${e.school || ""} (${e.startDate || ""} – ${e.endDate || ""})${
              e.notes ? " — " + e.notes : ""
            }`
          )
          .join("\n")
      : "";

    // Format EXPERIENCE if your work page uses arrays (safe fallback)
    const formattedExperience = Array.isArray(data.experience)
      ? data.experience
          .map(w =>
            `${w.jobTitle || ""} — ${w.company || ""} (${w.startDate || ""} – ${w.endDate || ""})\n${w.description || ""}`
          )
          .join("\n\n")
      : data.experience || "";

    const payload = {
      TEMPLATE: data.template || "Template",

      NAME: data.name || "",
      EMAIL: data.email || "",
      PHONE: data.phone || "",
      ADDRESS: data.address || "",
      LOCATION: `${data.city || ""}, ${data.state || ""}`,

      PROFESSIONAL_SUMMARY: data.objective || "",
      SKILLS: data.skills || "",

      EXPERIENCE: formattedExperience,
      EDUCATION: formattedEducation,

      PROGRAM_CERTIFICATIONS:
        data.certifications?.programCertsSelected?.join(", ") || "",

      OUTSIDE_CERTIFICATIONS: data.certifications?.extraCerts || "",
      GENERAL_NOTES: data.certifications?.extraSkills || ""
    };

    console.log("FINAL PAYLOAD:", payload);

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
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Finalize Resume</h1>
      <p>Your resume is almost ready.</p>

      <button
        onClick={generateResume}
        disabled={loading}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          cursor: "pointer",
          marginTop: "20px"
        }}
      >
        {loading ? "Generating..." : "Download Resume"}
      </button>
    </div>
  );
}
