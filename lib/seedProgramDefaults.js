const PROGRAM_DEFAULT_RULES = [
  {
    match: /automotive|motorcycle|power equipment/i,
    skills: [
      "Diagnostics",
      "Brake service",
      "Oil changes",
      "Tire rotation",
      "Electrical testing",
      "Shop safety",
    ],
    certifications: [
      "ASE Student Certification",
      "EPA Section 609",
      "OSHA 10",
      "Manufacturer training",
    ],
  },
  {
    match: /hvac|refrigeration|climate|ac technology/i,
    skills: [
      "Refrigerant handling",
      "System troubleshooting",
      "Electrical testing",
      "Brazing",
      "Preventive maintenance",
      "Customer service",
    ],
    certifications: [
      "EPA Section 608",
      "OSHA 10",
      "NATE Ready-to-Work",
      "R-410A Safety",
    ],
  },
  {
    match: /welding/i,
    skills: [
      "MIG welding",
      "TIG welding",
      "Stick welding",
      "Blueprint reading",
      "Metal fabrication",
      "Weld inspection",
    ],
    certifications: [
      "AWS Certification",
      "OSHA 10",
      "Forklift Certification",
      "First Aid/CPR",
    ],
  },
  {
    match: /electrical|electro-mechanical|industrial maintenance/i,
    skills: [
      "Electrical troubleshooting",
      "Motor controls",
      "PLC basics",
      "Preventive maintenance",
      "Blueprint/schematic reading",
      "Lockout/tagout",
    ],
    certifications: [
      "OSHA 10",
      "NFPA 70E Awareness",
      "First Aid/CPR",
      "Forklift Certification",
    ],
  },
  {
    match: /building|construction/i,
    skills: [
      "Blueprint reading",
      "Power tools",
      "Framing",
      "Drywall",
      "Measuring and layout",
      "Job-site safety",
    ],
    certifications: [
      "OSHA 10",
      "Forklift Certification",
      "First Aid/CPR",
      "Scissor Lift/Aerial Lift",
    ],
  },
  {
    match: /truck|cdl|diesel|heavy equipment/i,
    skills: [
      "Pre-trip inspections",
      "Diesel maintenance",
      "Hydraulics",
      "Preventive maintenance",
      "DOT safety",
      "Equipment operation",
    ],
    certifications: [
      "CDL Permit or License",
      "OSHA 10",
      "Forklift Certification",
      "DOT Medical Card",
    ],
  },
  {
    match: /machinist|cnc|manufacturing/i,
    skills: [
      "CNC operation",
      "Blueprint reading",
      "Precision measurement",
      "Calipers and micrometers",
      "Machine setup",
      "Quality control",
    ],
    certifications: [
      "NIMS Certification",
      "OSHA 10",
      "Forklift Certification",
      "Lean Manufacturing",
    ],
  },
];

export const FALLBACK_PROGRAM_DEFAULTS = {
  skills: [
    "Safety procedures",
    "Hand and power tools",
    "Customer service",
    "Teamwork",
    "Problem solving",
    "Time management",
  ],
  certifications: ["OSHA 10", "First Aid/CPR", "Forklift Certification"],
};

export function defaultsForProgram(program) {
  const rule = PROGRAM_DEFAULT_RULES.find((item) => item.match.test(program || ""));
  if (!rule) return { ...FALLBACK_PROGRAM_DEFAULTS };
  return {
    skills: [...rule.skills],
    certifications: [...rule.certifications],
  };
}
