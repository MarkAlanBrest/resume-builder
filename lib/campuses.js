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

export function getAllPrograms() {
  const programs = new Set();
  Object.values(CAMPUSES).forEach((list) => list.forEach((p) => programs.add(p)));
  return [...programs].sort();
}

export function getCampusForProgram(program) {
  return Object.entries(CAMPUSES)
    .filter(([, programs]) => programs.includes(program))
    .map(([campus]) => campus);
}
