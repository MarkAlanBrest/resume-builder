<script>
/* ===== PROGRAM CERT DATA (AS YOU PROVIDED) ===== */
const PROGRAM_CERTS = {
  "Automotive Technology — Main Campus (New Castle, PA)": {
    credential: "Associate in Specialized Technology Degree",
    certifications: [
      "PA State Safety Inspection License",
      "PA Emissions Inspection License",
      "EPA Section 609 Certification",
      "ASE Entry-Level Certifications"
    ]
  },
  "Building Technology — Main Campus (New Castle, PA)": {
    credential: "Associate in Specialized Building Technology",
    certifications: [
      "OSHA 10",
      "Forklift Certification",
      "Scaffolding and Ladder Safety"
    ]
  },
  "Combination Welding — Main Campus (New Castle, PA)": {
    credential: "Diploma",
    certifications: [
      "AWS D1.1 Structural Steel",
      "AWS D1.3 Sheet Metal",
      "FCAW Plate Certification",
      "OSHA 10",
      "Hot Work Safety"
    ]
  },
  "Combination Welding — East Liverpool Campus (East Liverpool, OH)": {
    credential: "Diploma",
    certifications: [
      "AWS D1.1 Structural Steel",
      "AWS D1.3 Sheet Metal",
      "FCAW Plate Certification",
      "OSHA 10",
      "Hot Work Safety"
    ]
  },
  "Commercial Truck Driving (Class A CDL) — Satellite Campus (Pulaski, PA)": {
    credential: "Certificate",
    certifications: [
      "Class A CDL License",
      "FMCSA Entry-Level Driver Training (ELDT)",
      "DOT Medical Card",
      "OSHA 10 (varies)"
    ]
  },
  "Diesel & Heavy Equipment Repair Technology — Satellite Campus (Pulaski, PA)": {
    credential: "Associate in Specialized Technology Degree",
    certifications: [
      "OSHA 10",
      "EPA Section 609 Certification",
      "Forklift Certification",
      "ASE Entry-Level Diesel Certifications",
      "Hydraulics and Heavy Equipment Safety"
    ]
  },
  "Electrical Technology — Main Campus (New Castle, PA)": {
    credential: "Associate in Specialized Technology Degree",
    certifications: [
      "OSHA 10",
      "NFPA 70E Electrical Safety",
      "Lockout/Tagout Certification",
      "First Aid / CPR",
      "Electrical Safety Cards"
    ]
  },
  "Electrical & Industrial Maintenance — East Liverpool Campus (East Liverpool, OH)": {
    credential: "Diploma",
    certifications: [
      "OSHA 10",
      "NFPA 70E Electrical Safety",
      "Lockout/Tagout Certification",
      "Forklift Certification",
      "Industrial Maintenance Safety"
    ]
  },
  "Heavy Equipment Operations with CDL — Satellite Campus (Pulaski, PA)": {
    credential: "Diploma",
    certifications: [
      "Class A CDL License",
      "OSHA 10",
      "Heavy Equipment Operation Cards (Loader, Excavator, Dozer, etc.)",
      "Rigging and Signaling",
      "Forklift Certification"
    ]
  },
  "Industrial Electro-Mechanical Technology — Main Campus (New Castle, PA)": {
    credential: "Associate in Specialized Technology Degree",
    certifications: [
      "OSHA 10",
      "NFPA 70E Electrical Safety",
      "Lockout/Tagout Certification",
      "Forklift Certification",
      "PLC Safety and Operation"
    ]
  },
  "Machinist & CNC Manufacturing — Satellite Campus (Pulaski, PA)": {
    credential: "Diploma",
    certifications: [
      "OSHA 10",
      "NIMS Machining Credentials",
      "CNC Operator Safety",
      "Precision Measurement Certification"
    ]
  },
  "Motorcycle & Power Equipment Technology — Satellite Campus (Pulaski, PA)": {
    credential: "Diploma",
    certifications: [
      "OSHA 10",
      "Small Engine Safety Certification",
      "Motorcycle Electrical Diagnostics Safety",
      "EPA Section 609 Certification (varies)"
    ]
  },
  "Refrigeration & A/C Technology — Main Campus (New Castle, PA)": {
    credential: "Associate in Specialized Technology Degree",
    certifications: [
      "EPA Section 608 Universal Certification",
      "R-410A Safety Certification",
      "OSHA 10",
      "Brazing and Refrigeration Safety Cards"
    ]
  },
  "Refrigeration & Climate Control — East Liverpool Campus (East Liverpool, OH)": {
    credential: "Diploma",
    certifications: [
      "EPA Section 608 Universal Certification",
      "R-410A Safety Certification",
      "OSHA 10",
      "Brazing and Refrigeration Safety Cards"
    ]
  }
};

/* ===== STORAGE ===== */
function getData() {
  return JSON.parse(localStorage.getItem("resumeData")) || {};
}
function setData(data) {
  localStorage.setItem("resumeData", JSON.stringify(data));
}

/* ===== LOAD ===== */
window.onload = function () {
  const data = getData();

  const program = data.programCampus;
  if (!PROGRAM_CERTS[program]) {
    alert("No certifications found for selected program.");
    return;
  }

  data.certifications ||= {
    programCertsSelected: [],
    extraCerts: "",
    extraSkills: ""
  };

  document.getElementById("programDisplay").textContent =
    `Program Selected: ${program}`;

  document.getElementById("extraCerts").value =
    data.certifications.extraCerts || "";

  document.getElementById("extraSkills").value =
    data.certifications.extraSkills || "";

  const selected = data.certifications.programCertsSelected;
  const container = document.getElementById("programCerts");
  container.innerHTML = "";

  PROGRAM_CERTS[program].certifications.forEach((cert, i) => {
    const row = document.createElement("div");
    row.className = "check-row";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = "cert" + i;
    cb.value = cert;
    cb.checked = selected.includes(cert);

    const label = document.createElement("label");
    label.htmlFor = cb.id;
    label.textContent = cert;

    row.appendChild(cb);
    row.appendChild(label);
    container.appendChild(row);
  });
};

/* ===== NAV ===== */
function goBack() {
  window.location.href = "work.html";
}

function goNext() {
  const data = getData();

  data.certifications.programCertsSelected = Array.from(
    document.querySelectorAll("#programCerts input:checked")
  ).map(cb => cb.value);

  data.certifications.extraCerts =
    document.getElementById("extraCerts").value.trim();

  data.certifications.extraSkills =
    document.getElementById("extraSkills").value.trim();

  setData(data);
  window.location.href = "education-military-v2.html";
}
</script>