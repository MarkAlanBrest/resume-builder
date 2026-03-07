"use client";
import { useState } from "react";

const SHOW_TEST_BUTTON =
  process.env.NEXT_PUBLIC_SHOW_TEST_BUTTON === "true";

const templates = [
  { id: "Template", label: "Template 1 (Classic)" },
  { id: "TemplateA", label: "Template 2 (Modern)" },
  { id: "TemplateB", label: "Template 3 (Compact)" },
  { id: "TemplateC", label: "Template 4 (Creative)" },

  { id: "TemplateD", label: "Coming Soon" },
  { id: "TemplateE", label: "Coming Soon" },
  { id: "TemplateF", label: "Coming Soon" },
  { id: "TemplateG", label: "Coming Soon" }
];

// Basic cleanup helpers
function cleanText(v) {
  if (!v) return "";
  return String(v).trim();
}

function capitalizeFirst(v) {
  if (!v) return "";
  v = v.trim();
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

function upper(v) {
  if (!v) return "";
  return v.trim().toUpperCase();
}

export default function FinalizePage() {
  const [selectedTemplate, setSelectedTemplate] = useState("Template");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generateResume(templateOverride) {
    if ((!confirmed && !templateOverride) || loading) return;
    setLoading(true);

    try {
      const d = JSON.parse(localStorage.getItem("resumeData")) || {};

      const cleanedEducation = (d.education || []).map((e) => ({
        school: cleanText(e.school),
        program: cleanText(e.program),
        city: capitalizeFirst(e.city),
        state: upper(e.state),
        startDate: cleanText(e.startDate),
        endDate: cleanText(e.endDate),
        notes: cleanText(e.notes)
      }));

      const payload = {
        TEMPLATE: templateOverride || selectedTemplate,

        student: {
          name: cleanText(d.name),
          email: cleanText(d.email),
          phone: cleanText(d.phone),
          address: cleanText(d.address),
          city: capitalizeFirst(d.city),
          state: upper(d.state),
          zip: cleanText(d.zip),
          programCampus: cleanText(d.programCampus),
          graduationDate: cleanText(d.grad)
        },

        workExperience: d.workExperience || [],
        militaryService: d.militaryService || [],
        education: cleanedEducation,

        allCerts: cleanText(d.allCerts),
        allSkills: cleanText(d.allSkills),

        careerContext: {
          objectives: cleanText(d.objectives),
          jobTarget: cleanText(d.jobTarget),
          notes: cleanText(d.notes)
        }
      };

      const res = await fetch("/api/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        alert("Resume generation failed");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Resume generation failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function generateTestResume() {
    generateResume("TemplateD");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #cbd5e1, #64748b)"
      }}
    >
      <div
        style={{
          width: "900px",
          background: "#fff",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginBottom: "10px", color: "#1e3a8a" }}>
          Finalize Resume
        </h1>
        <p>Select a resume layout below.</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "18px",
            margin: "30px 0"
          }}
        >
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => !loading && setSelectedTemplate(t.id)}
              style={{
                height: "180px",
                border:
                  selectedTemplate === t.id
                    ? "3px solid #1e3a8a"
                    : "2px dashed #94a3b8",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                background:
                  selectedTemplate === t.id ? "#e2e8f0" : "#f8fafc",
                userSelect: "none"
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <label style={{ display: "block", marginBottom: "20px" }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ marginRight: "8px" }}
            disabled={loading}
          />
          Students must agree to review their resume. They are responsible for
          the accuracy and final content of the document.
        </label>

        <button
          onClick={() => generateResume()}
          disabled={!confirmed || loading}
          style={{
            padding: "14px 28px",
            fontSize: "16px",
            cursor: confirmed && !loading ? "pointer" : "not-allowed",
            background: loading ? "#94a3b8" : "#1e3a8a",
            color: "white",
            border: "none",
            borderRadius: "6px"
          }}
        >
          {loading ? "Resume being generated…" : "Download Resume"}
        </button>

        {SHOW_TEST_BUTTON && (
          <button
            onClick={generateTestResume}
            disabled={loading}
            style={{
              marginTop: "12px",
              padding: "10px 22px",
              fontSize: "14px",
              background: "#e2e8f0",
              color: "#1e3a8a",
              border: "1px solid #94a3b8",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            Test Resume (TemplateD)
          </button>
        )}

        {loading && (
          <p style={{ color: "red", fontSize: "20px", marginTop: "15px" }}>
            Resume being generated…
          </p>
        )}
      </div>
    </div>
  );
}