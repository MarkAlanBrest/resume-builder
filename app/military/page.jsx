"use client";
import { useState, useEffect } from "react";

export default function MilitaryPage() {
  const [resumeData, setResumeData] = useState({});
  const [service, setService] = useState([]);

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("resumeData")) || {};
    setResumeData(d);
    setService(d.militaryService || []);
  }, []);

  function addService() {
    setService([
      ...service,
      { branch: "", start: "", end: "", role: "", notes: "" }
    ]);
  }

  function updateService(i, field, value) {
    const updated = [...service];
    updated[i][field] = value;
    setService(updated);
  }

  function saveAndContinue() {
    const updated = {
      ...resumeData,
      militaryService: service
    };

    localStorage.setItem("resumeData", JSON.stringify(updated));
    window.location.href = "/finalize";
  }

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Military Service</h1>

      {service.map((s, i) => (
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
            placeholder="Branch"
            value={s.branch}
            onChange={(e) => updateService(i, "branch", e.target.value)}
          />

          <input
            placeholder="Start Date"
            value={s.start}
            onChange={(e) => updateService(i, "start", e.target.value)}
          />

          <input
            placeholder="End Date"
            value={s.end}
            onChange={(e) => updateService(i, "end", e.target.value)}
          />

          <input
            placeholder="Role"
            value={s.role}
            onChange={(e) => updateService(i, "role", e.target.value)}
          />

          <textarea
            placeholder="Notes"
            value={s.notes}
            onChange={(e) => updateService(i, "notes", e.target.value)}
          />
        </div>
      ))}

      <button onClick={addService} style={{ marginRight: "20px" }}>
        Add Service Record
      </button>

      <button onClick={saveAndContinue}>Save & Continue</button>
    </div>
  );
}
