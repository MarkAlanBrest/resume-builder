"use client";
import { useState } from "react";

const SHOW_TEST_BUTTON =
  process.env.NEXT_PUBLIC_SHOW_TEST_BUTTON === "true";

const templates = [
  { id: "TemplateA", label: "Template 1 (Classic)" },
  { id: "TemplateB", label: "Template 2 (Modern)" },
  { id: "TemplateC", label: "Template 3 (Compact)" },
  { id: "TemplateD", label: "Template 4 (Creative)" },
  { id: "TemplateE", label: "Template 5" },
  { id: "TemplateF", label: "Template 6" },
  { id: "TemplateG", label: "Template 7" },
  { id: "TemplateH", label: "Template 8" }
];

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
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [aiResume, setAiResume] = useState(null);   // <-- stored AI result

  async function generateResumeContent() {
    if (loading) return;

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

      const res = await fetch("/api/generateResumeAI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        alert("AI resume generation failed");
        return;
      }

      const aiData = await res.json();

      setAiResume(aiData);     // store AI result in variable
      setGenerated(true);

    } catch (e) {
      alert("Resume generation failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function downloadTemplate(templateId) {
    if (!generated || !confirmed || loading || !aiResume) return;

    setLoading(true);

    try {
      const res = await fetch("/api/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TEMPLATE: templateId,
          data: aiResume
        })
      });

      if (!res.ok) {
        alert("Resume generation failed");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${templateId}.docx`;
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
          width: "1000px",
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

        {loading && (
          <p style={{ color: "red", fontSize: "20px", marginBottom: "15px" }}>
            Resume being generated…
          </p>
        )}

        <button
          onClick={generateResumeContent}
          disabled={loading || generated}
          style={{
            marginBottom: "20px",
            padding: "14px 32px",
            fontSize: "16px",
            background: generated ? "#16a34a" : "#1e3a8a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading || generated ? "not-allowed" : "pointer"
          }}
        >
          {generated ? "Resume Content Ready ✓" : "Generate Resume"}
        </button>

        <div
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "18px",
            marginBottom: "30px",
            textAlign: "left",
            background: "#f8fafc"
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginRight: "8px" }}
            />

            I confirm that I have reviewed the information entered and
            understand that I am responsible for verifying the accuracy
            of all information included in my resume before submitting
            it to employers.
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "24px"
          }}
        >
          {templates.map((t) => {
            const locked = !generated;

            return (
              <div
                key={t.id}
                onClick={() => !locked && downloadTemplate(t.id)}
                style={{
                  width: "100%",
                  height: "340px",
                  border: "2px solid #cbd5f5",
                  borderRadius: "10px",
                  background: locked ? "#e2e8f0" : "#f8fafc",
                  opacity: locked ? 0.4 : 1,
                  cursor: locked ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "15px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
                }}
              >
                {t.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}