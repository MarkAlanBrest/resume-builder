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
    const totalProgram = programCerts.filter(c => c.trim() !== "").length;
    const extraCertLength = extraCerts.trim().length;
    const extraSkillsLength = extraSkills.trim().length;

    // ✅ VALIDATION
    if (
      totalProgram < 2 &&
      extraCertLength < 20 &&
      extraSkillsLength < 20
    ) {
      alert("Please enter at least 2 certifications OR add more detail in the text boxes.");
      return;
    }

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

      {/* ✅ Instructions */}
      <p style={{
        fontSize:"14px",
        color:"#475569",
        marginBottom:"20px"
      }}>
        Add at least 2 certifications OR provide detailed information in the sections below.
      </p>

      {/* 🔹 Program Certifications */}
      <h3>Program Certifications (Add at least 2 OR complete the sections below)</h3>

      {programCerts.map((c, i) => (
        <input
          key={i}
          placeholder="Certification (Example: OSHA 10, NCCER Core)"
          value={c}
          onChange={(e) => updateProgramCert(i, e.target.value)}
          style={{ display: "block", marginBottom: "10px", width:"100%" }}
        />
      ))}

      <button onClick={addProgramCert} style={{ marginBottom: "20px" }}>
        Add Certification
      </button>

      {/* 🔹 Extra Certifications */}
      <h3>Additional Certifications (Optional)</h3>
      <p style={{ fontSize:"13px", color:"#475569", marginBottom:"6px" }}>
        List any certifications, licenses, or training you have completed.
      </p>

      <textarea
        placeholder="Example: OSHA 10 certified, basic first aid training, forklift safety training"
        value={extraCerts}
        onChange={(e) => setExtraCerts(e.target.value)}
        style={{ width: "100%", height: "80px", marginBottom: "20px" }}
      />

      {/* 🔹 Skills */}
      <h3>Skills (Optional)</h3>
      <p style={{ fontSize:"13px", color:"#475569", marginBottom:"6px" }}>
        List tools, equipment, software, or hands-on abilities.
      </p>

      <textarea
        placeholder="Example: Measuring and cutting materials, using hand and power tools, reading blueprints"
        value={extraSkills}
        onChange={(e) => setExtraSkills(e.target.value)}
        style={{ width: "100%", height: "80px", marginBottom: "20px" }}
      />

      <button onClick={saveAndContinue}>
        Save & Continue
      </button>

    </div>
  );
}