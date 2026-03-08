"use client";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("resumeContentReady");
      if (saved === "true") setGenerated(true);
    }
  }, []);

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
        TEMPLATE: "Template",

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
      const buffer = await blob.arrayBuffer();

      sessionStorage.setItem(
        "resumeDoc",
        JSON.stringify(Array.from(new Uint8Array(buffer)))
      );

      sessionStorage.setItem("resumeContentReady", "true");

      setGenerated(true);
    } catch (e) {
      alert("Resume generation failed");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate(templateId) {
    if (!generated || !confirmed) return;

    const stored = sessionStorage.getItem("resumeDoc");
    if (!stored) return;

    const bytes = new Uint8Array(JSON.parse(stored));

    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.docx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  }

  function generateTestResume() {
    downloadTemplate("TemplateD");
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

        <button
          onClick={generateResumeContent}
          disabled={loading || generated}
          style={{
            marginBottom: "25px",
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
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "22px",
            margin: "25px 0"
          }}
        >
          {templates.map((t) => {
            const locked = !generated;

            return (
              <div
                key={t.id}
                onClick={() => !locked && downloadTemplate(t.id)}
                style={{
                  height: "200px",
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

        <div
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "18px",
            marginTop: "20px",
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

            I confirm that I have reviewed the information entered and I
            understand that I am responsible for verifying the accuracy of
            all information included in my resume before submitting it to
            employers.
          </label>
        </div>

        {SHOW_TEST_BUTTON && (
          <button
            onClick={generateTestResume}
            style={{
              marginTop: "18px",
              padding: "10px 22px",
              fontSize: "14px",
              background: "#e2e8f0",
              color: "#1e3a8a",
              border: "1px solid #94a3b8",
              borderRadius: "6px"
            }}
          >
            Test Resume
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