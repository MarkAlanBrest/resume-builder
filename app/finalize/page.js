"use client";
import { useState } from "react";
import { useState, useEffect } from "react";
const templates = [
  { id: "TemplateA", label: "Classic", desc: "Best for first-time resumes and entry-level jobs" },
  { id: "TemplateB", label: "Modern", desc: "Clean layout for students with some experience" },
  { id: "TemplateC", label: "Compact", desc: "Great for short resumes or limited experience" },
  { id: "TemplateD", label: "Creative", desc: "Good for standing out in hands-on or trade jobs" },
  { id: "TemplateE", label: "Professional", desc: "Strong choice for most job applications" },
  { id: "TemplateF", label: "Structured", desc: "Organized layout for multiple jobs" },
  { id: "TemplateG", label: "Skills Focused", desc: "Highlights skills over job history" },
  { id: "TemplateH", label: "Bold", desc: "Good for confident applicants with experience" },

  { id: "TemplateI", label: "Entry Simple", desc: "Perfect for students with no work history" },
  { id: "TemplateJ", label: "Work Ready", desc: "Great for students entering the workforce" },
  { id: "TemplateK", label: "Trade Focus", desc: "Designed for trade and technical careers" },
  { id: "TemplateL", label: "Clean Edge", desc: "Simple and professional for any job" },
  { id: "TemplateM", label: "Experience Plus", desc: "Best for multiple jobs or longer history" },
  { id: "TemplateN", label: "Minimal", desc: "Keeps it simple and easy to read" },
  { id: "TemplateO", label: "Student Pro", desc: "Balanced layout for school + work experience" },
  { id: "TemplateP", label: "Showcase", desc: "Highlights strengths and key achievements" }
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

  const [confirmed,setConfirmed] = useState(false);
  const [loading,setLoading] = useState(false);
  const [generated,setGenerated] = useState(false);


  const [shuffledTemplates, setShuffledTemplates] = useState([]);

  useEffect(() => {
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  setShuffledTemplates(shuffled);
  
}, []);

  async function generateResumeContent(){

    if(loading) return;

    setLoading(true);

    try{

      const d = JSON.parse(localStorage.getItem("resumeData")) || {};

      const cleanedEducation = (d.education || []).map((e)=>({
        school: cleanText(e.school),
        program: cleanText(e.program),
        city: capitalizeFirst(e.city),
        state: upper(e.state),
        startDate: cleanText(e.startDate),
        endDate: cleanText(e.endDate),
        notes: cleanText(e.notes)
      }));

      const payload = {
        student:{
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

        careerContext:{
          objectives: cleanText(d.objectives),
          jobTarget: cleanText(d.jobTarget),
          notes: cleanText(d.notes)
        }
      };

      const res = await fetch("/api/generateResume",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          TEMPLATE:"TemplateA",
          ...payload
        })
      });

      if(!res.ok){
        alert("AI generation failed");
        return;
      }

      const result = await res.json();

      document.getElementById("aiResumeData").value =
        JSON.stringify(result.finalData);

      setGenerated(true);

    }
    catch(e){
      console.error(e);
      alert("Resume generation failed");
    }
    finally{
      setLoading(false);
    }

  }

  async function downloadTemplate(templateId){

    if(!generated || !confirmed || loading) return;

    setLoading(true);

    try{

      const stored =
        document.getElementById("aiResumeData").value;

      const finalData = JSON.parse(stored || "{}");

      const res = await fetch("/api/generateResume",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          TEMPLATE: templateId,
          finalData: finalData
        })
      });

      if(!res.ok){
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

    }
    catch(e){
      console.error(e);
      alert("Resume generation failed");
    }
    finally{
      setLoading(false);
    }

  }

  return (

    <div style={{
      minHeight:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      background:"linear-gradient(to bottom right,#cbd5e1,#64748b)"
    }}>

      <textarea id="aiResumeData" style={{display:"none"}} />

      <div style={{
        width:"1000px",
        background:"#fff",
        padding:"40px",
        borderRadius:"12px",
        boxShadow:"0 10px 25px rgba(0,0,0,0.15)",
        textAlign:"center"
      }}>

        <h1 style={{marginBottom:"10px",color:"#1e3a8a"}}>
          Finalize Resume
        </h1>

        {loading && (
          <p style={{color:"red",fontSize:"20px",marginBottom:"15px"}}>
            Resume being generated…
          </p>
        )}

        <button
          onClick={generateResumeContent}
          disabled={loading || generated}
          style={{
            marginBottom:"20px",
            padding:"14px 32px",
            fontSize:"16px",
            background: generated ? "#16a34a" : "#1e3a8a",
            color:"white",
            border:"none",
            borderRadius:"6px"
          }}
        >
          {generated ? "Resume Content Ready ✓" : "Generate Resume"}
        </button>

        {/* YELLOW WARNING BOX */}

        <div style={{
          border:"2px solid #facc15",
          borderRadius:"8px",
          padding:"18px",
          marginBottom:"30px",
          textAlign:"left",
          background:"#fef9c3"
        }}>

          <div style={{
            fontWeight:"bold",
            color:"#92400e",
            marginBottom:"10px",
            fontSize:"16px"
          }}>
            ⚠ Important: Review Before Using
          </div>

          <p style={{
            marginBottom:"12px",
            fontSize:"14px",
            color:"#78350f",
            lineHeight:"1.5"
          }}>
            This resume was generated using AI. You must carefully review,
            edit, and approve all content before using it. Do not assume the
            information is correct. Verify dates, employers, skills, and all
            details to ensure the resume is accurate and professional.
          </p>

          <label style={{fontWeight:"bold",color:"#78350f"}}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e)=>setConfirmed(e.target.checked)}
              style={{
                marginRight:"10px",
                transform:"scale(1.3)",
                accentColor:"#eab308"
              }}
            />
            I understand that I must review and edit this resume before using it.
          </label>

        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(4,1fr)",
          gap:"24px"
        }}>
{shuffledTemplates.map((t)=>{
            const locked = !generated;

            return (
          <div
  key={t.id}
  onClick={()=>!locked && downloadTemplate(t.id)}

  onMouseEnter={(e)=>{
    if(!locked){
      e.currentTarget.style.transform = "scale(1.03)";
      e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
    }
  }}

  onMouseLeave={(e)=>{
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
  }}

  style={{
    width:"100%",
    height:"340px",
    border:"2px solid #cbd5f5",
    borderRadius:"12px",
    background: locked ? "#e2e8f0" : "#f8fafc",
    opacity: locked ? 0.4 : 1,
    cursor: locked ? "not-allowed" : "pointer",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    fontWeight:"bold",
    fontSize:"15px",
    boxShadow:"0 4px 10px rgba(0,0,0,0.08)",
    transition:"all 0.2s ease"
  }}
>
              <div style={{textAlign:"center"}}>

  <img
    src={`/templates/preview/${t.id}.png`}
    style={{
      width:"100%",
      height:"260px",
      objectFit:"cover",
      borderRadius:"6px",
      marginBottom:"10px"
    }}
  />

  <div style={{fontWeight:"bold"}}>
    {t.label}
  </div>

  {/* 👇 THIS IS YOUR DESCRIPTION */}
  <div style={{
    fontSize:"13px",
    color:"#475569",
    marginTop:"4px",
    padding:"0 6px"
  }}>
    {t.desc}
  </div>

</div>
            </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}