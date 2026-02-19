function buildResumePayload(generalNotes, template) {
  generalNotes = generalNotes || "";
  template = template || "Template";

  var data = JSON.parse(localStorage.getItem("resumeData")) || {};

  function safe(v) {
    return (v && v !== "undefined") ? v : "";
  }

  var LOCATION = [data.city, data.state]
    .filter(function (v) { return v; })
    .join(", ");

  return {
    TEMPLATE: template,

    NAME: safe(data.name),
    EMAIL: safe(data.email),
    PHONE: safe(data.phone),
    ADDRESS: safe(data.address),
    LOCATION: LOCATION,

    PROFESSIONAL_SUMMARY: safe(data.objective),
    SKILLS: safe(data.skills),
    EXPERIENCE: safe(data.experience),
    EDUCATION: safe(data.education),
    PROGRAM_CERTIFICATIONS: safe(data.programCertifications),
    OUTSIDE_CERTIFICATIONS: safe(data.outsideCertifications),
    GENERAL_NOTES: safe(generalNotes)
  };
}

window.buildResumePayload = buildResumePayload;
