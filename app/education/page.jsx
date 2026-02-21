"use client";
import { useState, useEffect } from "react";

export default function EducationPage() {
  const [resumeData, setResumeData] = useState({});
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("resumeData")) || {};
    setResumeData(d);
    setSchools(d.education || []);
  }, []);

  function addSchool() {
    setSchools([
      ...schools,
      { school: "", program: "", startDate: "", endDate: "", notes: "" }
    ]);
  }

  function updateSchool(i, field, value) {
    const updated = [...schools];
    updated[i][field] = value;
    setSchools(updated);
  }

  function saveAndContinue() {
    const updated = {
      ...resumeData,
      education: schools
    };

    localStorage.setItem("resumeData", JSON.stringify(updated));
    window.location.href = "/finalize";
  }

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Education</h1>

      {schools.map((school, i) => (
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
            placeholder="School Name"
            value={school.school}
            onChange={(e) => updateSchool(i, "school", e.target.value)}
          />

          <input
            placeholder="Program"
            value={school.program}
            onChange={(e) => updateSchool(i, "program", e.target.value)}
          />

          <input
            placeholder="Start Date"
            value={school.startDate}
            onChange={(e) => updateSchool(i, "startDate", e.target.value)}
          />

          <input
            placeholder="End Date"
            value={school.endDate}
            onChange={(e) => updateSchool(i, "endDate", e.target.value)}
          />

          <textarea
            placeholder="Notes"
            value={school.notes}
            onChange={(e) => updateSchool(i, "notes", e.target.value)}
          />
        </div>
      ))}

      <button onClick={addSchool} style={{ marginRight: "20px" }}>
        Add School
      </button>

      <button onClick={saveAndContinue}>Save & Continue</button>
    </div>
  );
}
