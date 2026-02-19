function buildResumePayload(generalNotes) {
  return {
    NAME: localStorage.getItem("NAME") || "",
    EMAIL: localStorage.getItem("EMAIL") || "",
    PHONE: localStorage.getItem("PHONE") || "",
    ADDRESS: localStorage.getItem("ADDRESS") || "",
    CITY: localStorage.getItem("CITY") || "",
    STATE: localStorage.getItem("STATE") || "",
    ZIP: localStorage.getItem("ZIP") || "",

    PROFESSIONAL_SUMMARY: localStorage.getItem("PROFESSIONAL_SUMMARY") || "",
    SKILLS: localStorage.getItem("SKILLS") || "",
    EXPERIENCE: localStorage.getItem("EXPERIENCE") || "",
    EDUCATION: localStorage.getItem("EDUCATION") || "",
    PROGRAM_CERTIFICATIONS: localStorage.getItem("PROGRAM_CERTIFICATIONS") || "",
    OUTSIDE_CERTIFICATIONS: localStorage.getItem("OUTSIDE_CERTIFICATIONS") || "",

    GENERAL_NOTES: generalNotes || ""
  };
}

