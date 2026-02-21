"use client";
import { useState, useEffect } from "react";

export default function CertificationsPage() {
  const [resumeData, setResumeData] = useState({});
  const [programCerts, setProgramCerts] = useState([]);
  const [extraCerts, setExtraCerts] = useState("");
  const [extraSkills, setExtraSkills] = useState("");

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("resumeData")) || {};
    setResumeData(d);

    setProgramCerts(d.certifications?.programCerts || []);
    setExtraCerts(d.certifications?.extraCerts || "");
    setExtraSkills(d.certifications?.extraSkills || "");
  }, []);

  function addProgramCert() {
    setProgramCerts([...programCerts, ""]);
  }

  function updateProgramCert(i, value) {
    const updated = [...programCerts];
    updated[i] = value;
    setProgramCerts(updated);
  }

  function saveAndContinue() {
    const updated = {
      ...resumeData,
      certifications: {
        programCerts,
        extraCerts,
        extraSkills
      }
    };

    localStorage.setItem("resumeData", JSON.stringify(updated));
    window.location.href = "/finalize";
  }

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Certifications & Skills</h1>

      <h3>Program Certifications</h3>
      {programCerts.map((c, i) => (
        <input
          key={i}
          placeholder="Certification"
          value={c}
          onChange={(e) => updateProgramCert(i, e.target.value)}
          style={{ display: "block", marginBottom: "10px" }}
        />
      ))}

      <button onClick={addProgramCert} style={{ marginBottom: "20px" }}>
        Add Certification
      </button>

      <h3>Extra Certifications</h3>
      <textarea
        placeholder="Additional certifications"
        value={extraCerts}
        onChange={(e) => setExtraCerts(e.target.value)}
        style={{ width: "100%", height: "80px", marginBottom: "20px" }}
      />

      <h3>Extra Skills</h3>
      <textarea
        placeholder="Skills"
        value={extraSkills}
        onChange={(e) => setExtraSkills(e.target.value)}
        style={{ width: "100%", height: "80px", marginBottom: "20px" }}
      />

      <button onClick={saveAndContinue}>Save & Continue</button>
    </div>
  );
}
