export const CAMPUSES = {
  "Main Campus — New Castle, PA": [
    "Automotive Technology",
    "Building Technology",
    "Combination Welding",
    "Electrical Technology",
    "Industrial Electro-Mechanical Technology",
    "Refrigeration and AC Technology",
  ],
  "East Liverpool Campus — East Liverpool, OH": [
    "Combination Welding",
    "Electrical and Industrial Maintenance",
    "Refrigeration and Climate Control",
  ],
  "Satellite Campus — Pulaski, PA": [
    "Commercial Truck Driving CDL",
    "Diesel and Heavy Equipment Repair Technology",
    "Heavy Equipment Operations with CDL",
    "Machinist and CNC Manufacturing",
    "Motorcycle and Power Equipment Technology",
  ],
  "North American Trade Schools — Baltimore, MD": [
    "Building Construction Technology",
    "Combination Welding",
    "Electrical Technology",
    "HVAC Technology",
    "Diesel Technology",
    "Commercial Truck Driving with CDL License",
  ],
};

const BALTIMORE_PROGRAM_SUFFIX = {
  "Building Construction Technology": "Certificate in Building Construction Technology",
  "Combination Welding": "Certificate in Combination Welding",
  "Electrical Technology": "Certificate in Electrical Technology",
  "HVAC Technology": "Certificate in HVAC Technology",
  "Diesel Technology": "Certificate in Diesel Technology",
  "Commercial Truck Driving with CDL License":
    "Certificate in Commercial Truck Driving + CDL License",
};

const BALTIMORE_CAMPUS = "North American Trade Schools — Baltimore, MD";

function campusToSuffix(campus) {
  return `${campus.replace(" — ", " (")})`;
}

export function makeProgramKey(campus, program) {
  if (campus === BALTIMORE_CAMPUS) {
    const suffix = BALTIMORE_PROGRAM_SUFFIX[program];
    if (suffix) return `${program} — ${suffix}`;
  }
  return `${program} — ${campusToSuffix(campus)}`;
}

export function parseProgramKey(programKey) {
  for (const [campus, programs] of Object.entries(CAMPUSES)) {
    for (const program of programs) {
      if (makeProgramKey(campus, program) === programKey) {
        return { campus, program };
      }
    }
  }
  return null;
}

export function getProgramNameFromKey(programKey) {
  const parsed = parseProgramKey(programKey);
  if (parsed) return parsed.program;
  const separator = programKey.indexOf(" — ");
  return separator === -1 ? programKey : programKey.slice(0, separator);
}

export function expandLegacyProgramKey(legacyProgramName) {
  const keys = [];
  for (const [campus, programs] of Object.entries(CAMPUSES)) {
    if (programs.includes(legacyProgramName)) {
      keys.push(makeProgramKey(campus, legacyProgramName));
    }
  }
  return keys;
}

export function isLegacyProgramKey(programKey) {
  return !parseProgramKey(programKey);
}

export function getAllPrograms() {
  const programs = [];
  for (const [campus, list] of Object.entries(CAMPUSES)) {
    for (const program of list) {
      programs.push(makeProgramKey(campus, program));
    }
  }
  return programs.sort();
}

export function getCampusForProgram(programKey) {
  const parsed = parseProgramKey(programKey);
  if (parsed) return [parsed.campus];

  return Object.entries(CAMPUSES)
    .filter(([, programs]) => programs.includes(programKey))
    .map(([campus]) => campus);
}
