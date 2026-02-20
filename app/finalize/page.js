"use client";

import { useState } from "react";

export default function FinalizePage() {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Template");
  const [confirmed, setConfirmed] = useState(false);

  async function generateResume() {
    if (!confirmed || loading) return;

    setLoading(true);

    try {
      const data = JSON.parse(localStorage.getItem("resumeData")) || {};

      const payload = {
        TEMPLATE: selectedTemplate,
        NAME: data.name || "",
        EMAIL: data.email || "",
        PHONE: data.phone || "",
        ADDRESS: data.address || "",
        LOCATION: `${data.city || ""}, ${data.state || ""}`,
        PROFESSIONAL_SUMMARY: data.objective || "",
        SKILLS: data.skills || "",
        EXPERIENCE: data.experience || "",
        EDUCATION: data.education || "",
        PROGRAM_CERTIFICATIONS: data.programCertsSelected || "",
        OUTSIDE_CERTIFICATIONS: data.extraCerts || "",
        GENERAL_NOTES: data.generalNotes || ""
      };

      const res = await fetch("/api/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // 🔴 CRITICAL GUARD — prevents 1 KB corrupt downloads
      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR:", text);
        alert("Resume generation failed. Check logs.");
        setLoading(false);
        return;
      }

      const blob = await res.blob();

      // Extra safety check
      if (blob.size < 10_000) {
        console.error("Downloaded file too small:", blob.size);
        alert("Resume generation failed (invalid file).");
        setLoading(false);
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("FRONTEND ERROR:", err);
      alert("Unexpected error generating resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial", maxWidth: "600px" }}>
      <h1>Finalize Resume</h1>
      <p>Your resume is almost ready.</p>

      {/* Template Selection */}
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

      {/* Confirmation Checkbox */}
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

      {/* Generate Button */}
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

      {/* Loading Message */}
      {loading && (
        <p style={{ color: "red", marginTop: "15px" }}>
          Your resume is being generated…
        </p>
      )}
    </div>
  );
}