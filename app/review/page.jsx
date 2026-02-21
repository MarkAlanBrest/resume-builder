"use client";
import { useState, useEffect } from "react";

export default function ReviewPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("resumeData")) || {};
    setData(d);
  }, []);

  if (!data) return null;

  function continueToFinalize() {
    window.location.href = "/finalize";
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Review Your Information</h1>

      <section style={{ marginBottom: "30px" }}>
        <h2>Personal Info</h2>
        <p><strong>Name:</strong> {data.name}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Phone:</strong> {data.phone}</p>
        <p><strong>Address:</strong> {data.address}</p>
        <p><strong>City:</strong> {data.city}</p>
        <p><strong>State:</strong> {data.state}</p>
        <p><strong>ZIP:</strong> {data.zip}</p>
        <p><strong>Program + Campus:</strong> {data.programCampus}</p>
        <p><strong>Graduation Date:</strong> {data.grad}</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2>Career Context</h2>
        <p><strong>Objectives:</strong> {data.objectives}</p>
        <p><strong>Job Target:</strong> {data.jobTarget}</p>
        <p><strong>Notes:</strong> {data.notes}</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2>Work Experience</h2>
        {data.workExperience?.length === 0 && <p>No work experience added.</p>}
        {data.workExperience?.map((job, i) => (
          <div key={i} style={{ marginBottom: "15px" }}>
            <p><strong>Employer:</strong> {job.employer}</p>
            <p><strong>Title:</strong> {job.title}</p>
            <p><strong>Start:</strong> {job.start}</p>
            <p><strong>End:</strong> {job.end}</p>
            <p><strong>Tasks:</strong> {job.tasks}</p>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2>Education</h2>
        {data.education?.length === 0 && <p>No education added.</p>}
        {data.education?.map((ed, i) => (
          <div key={i} style={{ marginBottom: "15px" }}>
            <p><strong>School:</strong> {ed.school}</p>
            <p><strong>Program:</strong> {ed.program}</p>
            <p><strong>Start:</strong> {ed.startDate}</p>
            <p><strong>End:</strong> {ed.endDate}</p>
            <p><strong>Notes:</strong> {ed.notes}</p>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2>Certifications</h2>
        <p><strong>Program Certs:</strong> {data.certifications?.programCerts?.join(", ")}</p>
        <p><strong>Extra Certs:</strong> {data.certifications?.extraCerts}</p>
        <p><strong>Extra Skills:</strong> {data.certifications?.extraSkills}</p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2>Military Service</h2>
        {data.militaryService?.length === 0 && <p>No military service added.</p>}
        {data.militaryService?.map((m, i) => (
          <div key={i} style={{ marginBottom: "15px" }}>
            <p><strong>Branch:</strong> {m.branch}</p>
            <p><strong>Start:</strong> {m.start}</p>
            <p><strong>End:</strong> {m.end}</p>
            <p><strong>Role:</strong> {m.role}</p>
            <p><strong>Notes:</strong> {m.notes}</p>
          </div>
        ))}
      </section>

      <button onClick={continueToFinalize}>Continue to Finalize</button>
    </div>
  );
}
