const payload = {
  TEMPLATE: selectedTemplate,   // "Template", "TemplateA", etc.
  NAME: formData.NAME,
  EMAIL: formData.EMAIL,
  PHONE: formData.PHONE,
  ADDRESS: formData.ADDRESS,
  LOCATION: formData.LOCATION,
  PROFESSIONAL_SUMMARY: formData.PROFESSIONAL_SUMMARY,
  SKILLS: formData.SKILLS,
  EXPERIENCE: formData.EXPERIENCE,
  EDUCATION: formData.EDUCATION,
  PROGRAM_CERTIFICATIONS: formData.PROGRAM_CERTIFICATIONS,
  OUTSIDE_CERTIFICATIONS: formData.OUTSIDE_CERTIFICATIONS,
  GENERAL_NOTES: formData.GENERAL_NOTES
};

const res = await fetch("/api/generateResume", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});
