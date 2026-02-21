async function generateResume() {
  const payload = {
    TEMPLATE: "Template",
    student: {
      name: "TEST NAME",
      email: "test@email.com",
      phone: "555-555-5555",
      address: "123 Main St",
      city: "New Castle",
      state: "PA",
      zip: "16101",
      programCampus: "TEST PROGRAM",
      graduationDate: "05/2026"
    }
  };

  const res = await fetch("/api/generateResume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "resume.docx";
  a.click();
  URL.revokeObjectURL(url);
}