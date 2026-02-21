"use client";
import { useState } from "react";

export default function BuilderPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    programCampus: "",
    grad: "",
    objectives: "",
    jobTarget: "",
    notes: "",
    workExperience: [],
    education: [],
    certifications: {
      programCerts: [],
      extraCerts: "",
      extraSkills: ""
    }
  });

  function saveAndContinue() {
    localStorage.setItem("resumeData", JSON.stringify(form));
    window.location.href = "/finalize";
  }

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Resume Builder</h1>

      <input
        placeholder="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <input
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />

      <input
        placeholder="City"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
      />

      <input
        placeholder="State"
        value={form.state}
        onChange={(e) => setForm({ ...form, state: e.target.value })}
      />

      <input
        placeholder="ZIP"
        value={form.zip}
        onChange={(e) => setForm({ ...form, zip: e.target.value })}
      />

      <input
        placeholder="Program + Campus"
        value={form.programCampus}
        onChange={(e) => setForm({ ...form, programCampus: e.target.value })}
      />

      <input
        placeholder="Graduation Date"
        value={form.grad}
        onChange={(e) => setForm({ ...form, grad: e.target.value })}
      />

      <textarea
        placeholder="Objectives"
        value={form.objectives}
        onChange={(e) => setForm({ ...form, objectives: e.target.value })}
      />

      <textarea
        placeholder="Job Target"
        value={form.jobTarget}
        onChange={(e) => setForm({ ...form, jobTarget: e.target.value })}
      />

      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <button onClick={saveAndContinue}>Save & Continue</button>
    </div>
  );
}
