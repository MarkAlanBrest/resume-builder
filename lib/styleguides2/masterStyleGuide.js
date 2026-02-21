export const masterStyleGuide = `
===== GLOBAL RESUME RULES (APPLY TO ALL PROGRAMS) =====

These rules define the universal standards for every resume produced by the system. They override all other documents when conflicts occur.

--- Purpose of the Resume ---

The resume must be clean, professional, and employer‑ready. It should reflect the student’s program, job target, experience level, and strengths. All content must be:

- Clear and concise
- Accurate and factual
- Free of filler or exaggeration
- Free of assumptions
- Free of school promotional language

--- Required Resume Sections ---

Unless logic rules specify otherwise, every resume must include:

- Contact Information
- Professional Summary (only when appropriate)
- Skills (always included)
- Work Experience (if provided)
- Military Experience (if applicable)
- Projects or Hands‑On Experience (based on program + student input)
- Education
- Certifications / Licenses (when applicable)

Optional sections may be included only when the student provides content:

- Awards
- Volunteer Work
- Languages
- Additional Skills 

--- Formatting Standards ---

If the PROFESSIONAL_SUMMARY is short or written as a sentence or phrase:
- Rewrite it as a bulleted list
- Include at least 4 bullet points
- Each bullet must describe a skill, responsibility, or strength
- Keep bullets concise and job-focused
- Do not repeat wording


All resumes must follow these formatting rules:

- Clean, professional layout
- No icons, graphics, tables, or decorative elements
- No color formatting
- No references section
- Do not include “References available upon request”
- Do not include personal details such as age, marital status, or photos

--- Skills Section Rules ---

- Always include a Skills section
- Include program‑specific skills
- Include student‑provided skills
- Include military‑derived skills when applicable
- Avoid soft skills unless they add meaningful value

--- GPA and Attendance Rules ---

Include GPA only when it is 3.0 or higher, formatted as:

Academic Achievement: GPA 3.X

Include attendance only when it is 90% or higher. Alternate between:

- “Maintained 92% attendance”
- “Achieved 92% attendance throughout the program”

--- Optional Sections ---

Include optional sections only when the student provides content. Never fabricate.

--- Missing Information Rules ---

If a student leaves a field blank:

- Do NOT fabricate
- Do NOT guess
- Do NOT invent experience or details
- Skip the entire section if no valid content exists

--- Variation Rules ---

To avoid repetitive resumes:

- Vary attendance phrasing
- Vary summary structure
- Vary bullet point openings
- Vary soft skill placement
- Vary project descriptions

--- Placeholder Rules ---

Use placeholders only when required:

[STUDENT NAME], [PHONE], [EMAIL], [CITY, STATE], [PROGRAM NAME], [EXPECTED GRADUATION DATE], [CERTIFICATIONS], [PROJECTS]

If a placeholder cannot be filled, remove the entire line.

--- Final Global Rules ---

Never fabricate:

- Experience
- Certifications or licenses
- Awards or volunteer work
- Languages
- Tools or equipment the student did not use

Never include:

- School promotional language
- Instructor names
- Course numbers
- Campus descriptions

Never include personal details such as:

- Age
- Gender
- Marital status
- Photos
- Social Security number
- Driver’s license number (except CDL)

Resumes must always be:

- Clean
- Professional
- Single‑column
- ATS‑friendly
- Free of decorative elements
- Allowed to use simple horizontal lines


===== RESUME TYPE & TONE LOGIC =====

These rules determine the resume structure, style, and tone based on the student’s background, program, and experience level. They ensure the system selects the most effective resume format automatically.

--- Supported Resume Types ---

A. Work Experience Resume  
Used when the student has strong, relevant work history that aligns with the job target.

B. Project‑Based Resume  
Used when the student has little or no work history, is switching careers, or has strong hands‑on school projects.

C. Hybrid Resume  
Used when the student has a mix of work history and project experience.

D. Military‑Enhanced Hybrid Resume  
Used when the student has military experience that should be highlighted as a major strength.

E. CDL‑Focused Resume  
Used when the student is in a CDL or Heavy Equipment program and targeting driving or equipment operation roles.

F. Technical Resume  
Used for highly technical programs such as CNC, Electrical, HVAC, Diesel, or Electro‑Mechanical.

--- Resume Type Selection Logic ---

Apply the following rules in order:

1. If the student has no work history → Use a Project‑Based Resume  
2. If the student has strong work history → Use a Work Experience Resume  
3. If the student has mixed experience → Use a Hybrid Resume  
4. If the student has military experience → Use a Military‑Enhanced Hybrid Resume  
5. If the student is in CDL or Heavy Equipment → Use a CDL‑Focused Resume  
6. If the student is in CNC, Electrical, HVAC, Diesel, or Electro‑Mechanical → Use a Technical Resume  

If multiple conditions apply, choose the resume type that best highlights the student’s strongest qualifications.

--- Tone Logic ---

Supported tone types:

- Simple
- Professional (default)
- Technical
- Leadership‑Focused

Tone selection rules:

- If the student has military experience → Use Leadership‑Focused tone  
- If the program is technical → Use Technical tone  
- If the student has limited content → Use Simple tone  
- Otherwise → Use Professional tone  

Tone must remain consistent throughout the resume.

--- Summary Logic ---



Include a summary only when:

- The student has enough content to justify it  
- The student has a clear job target  
- The student has strengths worth highlighting  

Skip the summary when:

- The student has extremely limited content  
- The summary would be generic, repetitive, or weak  

A weak summary is worse than no summary.

--- Projects / Hands‑On Experience Logic ---

Include a Projects or Hands‑On Experience section when:

- The student has little or no work history  
- The program is hands‑on (e.g., Welding, Building Technology, Automotive, HVAC, Electrical, CNC, Diesel)  
- The student provides project details  

Skip the Projects section when:

- Work history is stronger than project experience  
- Projects would be redundant  

--- Physical Capabilities Logic ---

Include physical capabilities only when:

- The student explicitly provides physical capability information  
OR  
- The resume is too short AND the program is physical in nature (e.g., Welding, Building Technology, CDL, Heavy Equipment, Diesel, Electrical)

Rules:

- Use only one physical capability if used as filler  
- Do not exaggerate  
- Do not invent capabilities  

--- CDL‑Specific Rules ---

Include driving record information only when the student provides it.

Acceptable examples:

- “Clean MVR”
- “No major violations”

Never assume or fabricate driving history.


===== MILITARY EXPERIENCE & CERTIFICATIONS / LICENSES LOGIC =====

These rules apply only when the student has military experience and/or certifications or licenses. If neither applies, skip this entire section.

--- Military Experience Inclusion Rules ---

If the student has military experience, a Military Experience section must be included.

Placement rules:

- If Work Experience exists → place Military Experience immediately after it.  
- If no Work Experience exists → place Military Experience after the Skills section.  

Each military entry must include:

- Branch of service  
- Rank (optional)  
- Years of service  
- MOS / AFSC / Rating translated into civilian language  
- 3–6 bullet points describing duties and achievements  

--- Civilian Translation Rules ---

Translate military terminology into employer‑friendly language. Examples:

- “PMCS” → “Preventive maintenance and inspections”  
- “Fire Team Leader” → “Team supervisor”  
- “Armorer” → “Equipment manager”  
- “Motor Transport Operator” → “Commercial vehicle operator”  

Avoid unexplained acronyms and remove any sensitive or classified details.

--- Prohibited Military Content ---

Do NOT include:

- Combat details  
- Classified operations  
- Sensitive mission information  
- Acronyms without explanation  

--- Certifications & Licenses Inclusion Rules ---

Include:

- School‑provided certifications  
- Student‑provided certifications  
- Military‑earned certifications  

Structure rules:

- If the student has both certifications and licenses → separate them into two sections.  
- If the student has only certifications → use one combined Certifications section.  
- CDL licenses must always have their own dedicated section.  

Naming rules:

- Use official certification or license names.  
- Do not abbreviate unless widely recognized.  
- Never invent or infer certifications.  

--- Prohibited Certification Actions ---

Do NOT:

- Fabricate certifications or licenses  
- Assume certifications were earned  
- Include certifications the student did not provide  

===== PROGRAM: Automotive Technology — Main Campus (New Castle, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Automotive Technology — Main Campus (New Castle, PA)"

--- Program Purpose ---

This program prepares students for entry‑level automotive technician roles with emphasis on diagnostics, repair, and modern vehicle systems. Training includes classroom instruction and extensive hands‑on lab experience.

--- Core Focus Areas ---

- Engine repair and performance
- Electrical systems
- HVAC systems
- Chassis and drivetrains
- Computerized diagnostics

--- Competencies Developed ---

Students completing this program should be able to:

- Diagnose automotive systems
- Service engines and drivetrains
- Repair electrical and HVAC systems
- Use diagnostic scan tools
- Apply shop safety and customer service practices

--- Program‑Specific Skills ---

Include skills such as:

- Engine diagnostics
- Brake systems
- Suspension and steering
- Electrical troubleshooting
- HVAC service
- OBD II scanning
- Preventive maintenance
- Battery and charging systems
- Drivetrain service

--- Program‑Specific Tools ---

Students may have experience with:

- OBD II scanners
- Multimeters
- Lifts and jacks
- Torque wrenches
- A/C recovery machines
- Scan tools
- Brake lathes

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Performed full engine diagnostic and repair procedures
- Completed brake system overhaul and testing
- Conducted HVAC evacuation, recharge, and leak testing
- Diagnosed electrical faults using multimeters and wiring diagrams
- Performed suspension and steering component replacement

--- Program‑Specific Certifications ---

Include only if earned:

- EPA 609
- Any student‑provided certifications

--- Summary Keywords for Automotive Students ---

Diagnostics, Repair, Electrical systems, Customer service, Preventive maintenance

--- Work History Emphasis ---

When describing work experience for automotive students, highlight:

- Diagnostic accuracy
- Repair quality
- Safety compliance
- Customer communication



===== PROGRAM: Building Technology — Main Campus (New Castle, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Building Technology — Main Campus (New Castle, PA)"

--- Program Purpose ---

This program trains students in residential and light commercial construction. Instruction includes hands‑on experience in carpentry, framing, interior and exterior finishes, and project fundamentals.

--- Core Focus Areas ---

- Framing
- Roofing
- Doors and windows
- Interior and exterior construction
- Prints and codes
- Project management basics

--- Competencies Developed ---

Students completing this program should be able to:

- Interpret blueprints
- Frame structures
- Install interior and exterior finishes
- Apply building codes
- Use construction tools safely
- Perform basic project planning

--- Program‑Specific Skills ---

Include skills such as:

- Carpentry
- Framing
- Roofing
- Drywall installation
- Finish carpentry
- Window and door installation
- Blueprint reading
- Jobsite safety

--- Program‑Specific Tools ---

Students may have experience with:

- Circular saws
- Miter saws
- Nail guns
- Levels
- Tape measures
- Drills
- Hand tools

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Constructed wall framing and roof structures
- Installed drywall, trim, and interior finishes
- Completed window and door installations
- Interpreted blueprints for layout and measurement
- Assisted with residential remodeling tasks

--- Program‑Specific Certifications ---

Include only if earned:

- OSHA‑aligned safety training
- Any student‑provided certifications

--- Summary Keywords for Building Technology Students ---

Carpentry, Construction, Blueprint reading, Safety, Residential building

--- Work History Emphasis ---

When describing work experience for building technology students, highlight:

- Physical labor
- Tool usage
- Safety compliance
- Teamwork



===== PROGRAM: Combination Welding — East Liverpool Campus (East Liverpool, OH) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Combination Welding — East Liverpool Campus (East Liverpool, OH)"

--- Program Purpose ---

This program provides hands‑on welding training focused on entry‑level workforce readiness. Emphasis is placed on structural and pipe welding, safety, and fabrication fundamentals.

--- Core Focus Areas ---

- SMAW (Stick)
- GMAW (MIG)
- GTAW (TIG)
- FCAW (Flux‑Cored)
- Pipe welding
- Cutting processes
- Fabrication skills

--- Competencies Developed ---

Students completing this program should be able to:

- Execute welding procedures on plate and pipe
- Prepare joints and materials
- Perform structural and pipe welds
- Follow welding safety procedures
- Qualify for industry welding tests

--- Program‑Specific Skills ---

Include skills such as:

- SMAW, GMAW, GTAW, FCAW
- Structural welding
- Pipe welding
- Joint preparation
- Cutting and grinding
- Weld quality inspection

--- Program‑Specific Tools ---

Students may have experience with:

- Welding machines
- Grinders
- Cutting torches
- Personal protective equipment (PPE)
- Clamps and fabrication tools

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Performed structural welds on plate
- Completed pipe welding practice
- Prepared joints for welding
- Conducted cutting and fabrication tasks

--- Program‑Specific Certifications ---

Include only if earned:

- AWS test preparation
- Any student‑provided certifications

--- Summary Keywords for Welding Students ---

Structural welding, Pipe welding, Fabrication, Safety, Entry‑level readiness

--- Work History Emphasis ---

When describing work experience for welding students, highlight:

- Safety compliance
- Structural welding
- Pipe welding
- Fabrication skills



===== PROGRAM: Combination Welding — Main Campus (New Castle, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Combination Welding — Main Campus (New Castle, PA)"

--- Program Purpose ---

This program provides comprehensive welding training across multiple welding processes and fabrication skills. Instruction aligns with AWS and ASME standards and emphasizes safety, precision, and hands‑on skill development.

--- Core Focus Areas ---

- MIG welding
- TIG welding
- Stick welding
- Flux‑Cored Arc Welding (FCAW)
- Pipe welding
- Fabrication
- Blueprint reading
- Cutting processes

--- Competencies Developed ---

Students completing this program should be able to:

- Perform multi‑process welding
- Weld pipe and structural components
- Read and interpret blueprints
- Prepare materials for welding
- Follow welding safety standards
- Prepare for AWS and ASME certification testing

--- Program‑Specific Skills ---

Include skills such as:

- MIG, TIG, Stick, FCAW
- Pipe welding
- Structural welding
- Metal fabrication
- Cutting and grinding
- Weld inspection
- Blueprint interpretation

--- Program‑Specific Tools ---

Students may have experience with:

- MIG, TIG, and Stick welding machines
- Grinders
- Cutting torches
- Welding tables
- Clamps
- Personal protective equipment (PPE)

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Completed multi‑process welds on plate and pipe
- Fabricated metal structures from blueprints
- Performed weld preparation, fit‑up, and finishing
- Conducted weld tests aligned with AWS standards

--- Program‑Specific Certifications ---

Include only if earned:

- AWS test preparation
- Any student‑provided certifications

--- Summary Keywords for Welding Students ---

Welding, Fabrication, Pipe welding, Safety, Blueprint reading

--- Work History Emphasis ---

When describing work experience for welding students, highlight:

- Safety practices
- Precision and accuracy
- Fabrication skills
- Multi‑process welding capability

===== PROGRAM: Commercial Truck Driving (Class A CDL) — Satellite Campus (Pulaski, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Commercial Truck Driving (Class A CDL) — Satellite Campus (Pulaski, PA)"

--- Program Purpose ---

This program prepares students for commercial driving careers through classroom instruction and behind‑the‑wheel training. Emphasis is placed on safety, compliance, and real‑world driving skills.

--- Core Focus Areas ---

- DOT regulations
- Vehicle inspection
- Backing maneuvers
- Road driving
- Trip planning

--- Competencies Developed ---

Students completing this program should be able to:

- Operate tractor‑trailers safely
- Pass CDL knowledge and skills exams
- Comply with DOT regulations
- Perform pre‑trip and post‑trip inspections
- Manage driving documentation

--- Program‑Specific Skills ---

Include skills such as:

- Pre‑trip inspections
- Backing maneuvers (straight, offset, alley dock)
- Road driving
- Trip planning
- Logbook management
- Safety compliance

--- Program‑Specific Tools ---

Students may have experience with:

- Tractor‑trailers
- Vehicle inspection tools
- Logbook systems

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Completed full pre‑trip and post‑trip inspections
- Performed backing maneuvers under supervision
- Conducted supervised road driving
- Practiced trip planning and route documentation

--- Program‑Specific Certifications ---

Include only if earned:

- CDL Class A
- Any student‑provided certifications

--- Summary Keywords for CDL Students ---

CDL, Safety, DOT compliance, Vehicle inspection, Road operation

--- Work History Emphasis ---

When describing work experience for CDL students, highlight:

- Safety
- Reliability
- Documentation accuracy
- Equipment operation



===== PROGRAM: Diesel & Heavy Equipment Repair Technology — Satellite Campus (Pulaski, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Diesel & Heavy Equipment Repair Technology — Satellite Campus (Pulaski, PA)"

--- Program Purpose ---

This program prepares students for careers in diesel engine repair and heavy equipment maintenance. Training emphasizes diagnostics, hydraulics, electrical systems, and preventive maintenance through extensive hands‑on work.

--- Core Focus Areas ---

- Diesel engines
- Heavy equipment systems
- Hydraulics
- Electrical systems
- Powertrains
- Preventive maintenance

--- Competencies Developed ---

Students completing this program should be able to:

- Diagnose diesel engine systems
- Repair and service heavy equipment
- Troubleshoot hydraulic systems
- Perform electrical diagnostics
- Conduct preventive maintenance
- Interpret service manuals and technical documentation

--- Program‑Specific Skills ---

Include skills such as:

- Diesel engine repair
- Hydraulic troubleshooting
- Electrical diagnostics
- Powertrain service
- Equipment inspection
- Preventive maintenance

--- Program‑Specific Tools ---

Students may have experience with:

- Diagnostic scanners
- Hydraulic testers
- Multimeters
- Lifts and jacks
- Heavy equipment service tools

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Performed diesel engine teardown and rebuild tasks
- Diagnosed hydraulic system faults
- Conducted electrical troubleshooting on heavy equipment
- Completed preventive maintenance inspections

--- Program‑Specific Certifications ---

Include only if earned:

- Any student‑provided certifications

--- Summary Keywords for Diesel Students ---

Diesel engines, Heavy equipment, Hydraulics, Diagnostics, Maintenance

--- Work History Emphasis ---

When describing work experience for diesel students, highlight:

- Equipment operation
- Maintenance practices
- Troubleshooting skills
- Safety compliance



===== PROGRAM: Electrical & Industrial Maintenance — East Liverpool Campus (East Liverpool, OH) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Electrical & Industrial Maintenance — East Liverpool Campus (East Liverpool, OH)"

--- Program Purpose ---

This program prepares students for industrial electrical and maintenance roles. Training emphasizes electrical systems, mechanical maintenance, motors, controls, troubleshooting, and preventive maintenance within industrial environments.

--- Core Focus Areas ---

- Industrial electrical systems
- Mechanical maintenance
- Motors and controls
- Industrial safety
- Preventive maintenance
- Troubleshooting

--- Competencies Developed ---

Students completing this program should be able to:

- Perform industrial electrical maintenance tasks
- Troubleshoot electrical and mechanical systems
- Service motors and basic control systems
- Perform preventive maintenance procedures
- Follow industrial safety standards and lockout/tagout procedures

--- Program‑Specific Skills ---

Include skills such as:

- Electrical troubleshooting
- Industrial wiring
- Motor maintenance
- Basic motor controls
- Mechanical repair
- Preventive maintenance
- Safety compliance

--- Program‑Specific Tools ---

Students may have experience with:

- Multimeters
- Electrical hand tools
- Mechanical hand tools
- Test equipment
- Maintenance tools

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Troubleshot electrical faults in industrial training systems
- Performed motor inspection and basic maintenance
- Completed preventive maintenance tasks on mechanical equipment
- Applied lockout/tagout procedures during maintenance activities

--- Program‑Specific Certifications ---

Include only if earned:

- Any student‑provided certifications

--- Summary Keywords for Industrial Maintenance Students ---

Industrial maintenance, Electrical systems, Troubleshooting, Preventive maintenance, Safety

--- Work History Emphasis ---

When describing work experience for industrial maintenance students, highlight:

- Equipment maintenance
- Electrical troubleshooting
- Mechanical repair
- Safety compliance
- Reliability



===== PROGRAM: Electrical Technology — Main Campus (New Castle, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Electrical Technology — Main Campus (New Castle, PA)"

--- Program Purpose ---

This program provides training in residential, commercial, and industrial electrical systems. Students gain hands‑on experience in wiring, motors, controls, blueprint reading, and troubleshooting in accordance with electrical codes.

--- Core Focus Areas ---

- Residential wiring
- Commercial wiring
- Industrial electrical systems
- Motors and controls
- Blueprint reading
- Electrical codes (NEC standards)

--- Competencies Developed ---

Students completing this program should be able to:

- Install electrical systems
- Read and interpret electrical diagrams
- Troubleshoot electrical circuits
- Apply NEC standards
- Work with motors and controls

--- Program‑Specific Skills ---

Include skills such as:

- Wiring installation
- Conduit bending
- Circuit troubleshooting
- Motor controls
- Panel installation
- Blueprint reading

--- Program‑Specific Tools ---

Students may have experience with:

- Multimeters
- Conduit benders
- Wire strippers
- Hand tools
- Electrical testers

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Installed residential and commercial wiring
- Bent and installed conduit
- Wired motor control circuits
- Troubleshot electrical faults

--- Program‑Specific Certifications ---

Include only if earned:

- Any student‑provided certifications

--- Summary Keywords for Electrical Technology Students ---

Electrical wiring, Troubleshooting, NEC standards, Motors and controls, Safety

--- Work History Emphasis ---

When describing work experience for electrical technology students, highlight:

- Safety compliance
- Accuracy
- Electrical troubleshooting
- Installation quality

===== PROGRAM: Heavy Equipment Operations with CDL — Satellite Campus (Pulaski, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Heavy Equipment Operations with CDL — Satellite Campus (Pulaski, PA)"

--- Program Purpose ---

This program prepares students for entry‑level roles operating heavy equipment and commercial vehicles. Training emphasizes equipment operation, jobsite safety, inspections, and CDL‑related driving fundamentals.

--- Core Focus Areas ---

- Heavy equipment operation
- CDL driving fundamentals
- Equipment inspection
- Jobsite safety
- Basic maintenance
- Equipment transportation

--- Competencies Developed ---

Students completing this program should be able to:

- Operate heavy equipment safely and effectively
- Perform pre‑operation inspections
- Follow jobsite safety procedures
- Transport equipment in compliance with CDL regulations
- Perform basic operational maintenance checks

--- Program‑Specific Skills ---

Include skills such as:

- Heavy equipment operation
- Pre‑operation inspections
- CDL driving skills
- Equipment safety procedures
- Basic maintenance awareness
- Jobsite communication

--- Program‑Specific Tools ---

Students may have experience with:

- Bulldozers
- Excavators
- Loaders
- Commercial vehicles
- Inspection tools

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Operated heavy equipment under instructor supervision
- Performed daily equipment inspections
- Practiced safe equipment operation techniques
- Completed CDL‑related driving and transportation exercises

--- Program‑Specific Certifications ---

Include only if earned:

- CDL
- Any student‑provided certifications

--- Summary Keywords for Heavy Equipment Students ---

Heavy equipment, Equipment operation, CDL, Jobsite safety, Inspections

--- Work History Emphasis ---

When describing work experience for heavy equipment students, highlight:

- Equipment operation experience
- Safety compliance
- Reliability
- Equipment handling and awareness



===== PROGRAM: Industrial Electro‑Mechanical Technology — Main Campus (New Castle, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Industrial Electro‑Mechanical Technology — Main Campus (New Castle, PA)"

--- Program Purpose ---

This program combines electrical, mechanical, and automation training to prepare students for maintenance technician and industrial systems roles. Emphasis is placed on troubleshooting, equipment maintenance, and understanding integrated electrical‑mechanical systems.

--- Core Focus Areas ---

- Electrical systems
- Mechanical systems
- Programmable Logic Controllers (PLCs)
- Automation
- Motors and drives
- Troubleshooting

--- Competencies Developed ---

Students completing this program should be able to:

- Diagnose electrical and mechanical faults
- Work with PLC systems
- Maintain industrial equipment
- Install and repair motors and drives
- Interpret electrical and mechanical schematics

--- Program‑Specific Skills ---

Include skills such as:

- Electrical troubleshooting
- Mechanical repair
- PLC fundamentals
- Automation systems
- Preventive maintenance

--- Program‑Specific Tools ---

Students may have experience with:

- Multimeters
- Mechanical hand tools
- Electrical hand tools
- Test equipment

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Troubleshot electrical and mechanical systems
- Worked with PLC simulations
- Performed industrial equipment maintenance
- Installed motors and drives

--- Program‑Specific Certifications ---

Include only if earned:

- Any student‑provided certifications

--- Summary Keywords for Electro‑Mechanical Students ---

Electro‑mechanical, PLCs, Automation, Troubleshooting, Maintenance

--- Work History Emphasis ---

When describing work experience for electro‑mechanical students, highlight:

- Technical troubleshooting
- Equipment maintenance
- Integration of electrical and mechanical skills



===== PROGRAM: Machinist & CNC Manufacturing — Satellite Campus (Pulaski, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Machinist & CNC Manufacturing — Satellite Campus (Pulaski, PA)"

--- Program Purpose ---

This program prepares students for entry‑level roles in machining, manufacturing, and precision production. Training emphasizes CNC programming, machine setup, blueprint interpretation, measurement, and quality control.

--- Core Focus Areas ---

- CNC programming
- CNC machine setup and operation
- Manual machining
- Blueprint reading
- GD&T fundamentals
- Precision measurement
- Quality control

--- Competencies Developed ---

Students completing this program should be able to:

- Program and operate CNC mills and lathes
- Interpret blueprints and GD&T symbols
- Perform precision measurements
- Set up machining operations
- Maintain quality and accuracy in production environments

--- Program‑Specific Skills ---

Include skills such as:

- CNC programming (G‑code basics)
- CNC machine setup
- Manual machining
- Blueprint reading
- GD&T interpretation
- Precision measurement
- Quality inspection

--- Program‑Specific Tools ---

Students may have experience with:

- CNC mills and lathes
- Calipers and micrometers
- Dial indicators
- Height gauges
- Manual machining tools

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Programmed and operated CNC machines to produce precision parts
- Performed machine setup and tool changes
- Interpreted blueprints for machining operations
- Conducted precision measurements and quality checks

--- Program‑Specific Certifications ---

Include only if earned:

- NIMS‑aligned training
- Any student‑provided certifications

--- Summary Keywords for CNC Students ---

CNC programming, Machining, Blueprint reading, GD&T, Precision measurement, Quality control

--- Work History Emphasis ---

When describing work experience for CNC students, highlight:

- Accuracy and precision
- Machine operation
- Quality inspection
- Technical problem‑solving

===== PROGRAM: Motorcycle & Power Equipment Technology — Satellite Campus (Pulaski, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Motorcycle & Power Equipment Technology — Satellite Campus (Pulaski, PA)"

--- Program Purpose ---

This program prepares students to diagnose, service, and repair motorcycles, ATVs, and a wide range of small‑engine power equipment. Training emphasizes troubleshooting, disassembly, repair procedures, and hands‑on work with real equipment.

--- Core Focus Areas ---

- Motorcycle systems and repair
- Small engine diagnostics and service
- Electrical systems and ignition
- Fuel systems and carburetion
- Drivetrains and transmissions
- Power equipment maintenance (mowers, trimmers, etc.)

--- Competencies Developed ---

Students completing this program should be able to:

- Diagnose and repair motorcycle and small‑engine systems
- Disassemble, inspect, and reassemble engines and components
- Troubleshoot electrical and fuel‑system issues
- Perform routine maintenance and safety checks
- Interpret service manuals and technical diagrams

--- Program‑Specific Skills ---

Include skills such as:

- Small engine repair
- Motorcycle diagnostics
- Electrical troubleshooting
- Carburetor and fuel‑system service
- Engine teardown and rebuild
- Power equipment maintenance
- Preventive maintenance procedures

--- Program‑Specific Tools ---

Students may have experience with:

- Hand tools and mechanic’s tools
- Diagnostic meters
- Engine stands and lifts
- Carburetor tools
- Power equipment service tools

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Diagnosed and repaired motorcycle engine issues
- Serviced small engines used in power equipment
- Performed electrical troubleshooting on motorcycles and ATVs
- Completed engine teardown and reassembly exercises
- Conducted routine maintenance on multiple types of power equipment

--- Program‑Specific Certifications ---

Include only if earned:

- Any student‑provided certifications

--- Summary Keywords for Motorcycle & Power Equipment Students ---

Motorcycle repair, Small engines, Diagnostics, Power equipment, Electrical troubleshooting, Maintenance

--- Work History Emphasis ---

When describing work experience for these students, highlight:

- Mechanical aptitude
- Diagnostic accuracy
- Hands‑on repair experience
- Safety and reliability


===== PROGRAM: Refrigeration & A/C Technology — Main Campus (New Castle, PA) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Refrigeration & A/C Technology — Main Campus (New Castle, PA)"

--- Program Purpose ---

This program prepares students for entry‑level roles in heating, ventilation, air conditioning, and refrigeration (HVAC/R). Training emphasizes refrigeration theory, air conditioning systems, heating fundamentals, electrical concepts, and safe installation and service practices.

--- Core Focus Areas ---

- Refrigeration theory and system operation
- Air conditioning systems
- Heating fundamentals
- Electrical systems for HVAC/R
- Mechanical system applications
- Installation and service procedures
- Safety standards and codes (mechanical, fuel gas, electrical)

--- Competencies Developed ---

Students completing this program should be able to:

- Install, service, and maintain HVAC/R systems
- Diagnose refrigeration and A/C system faults
- Interpret wiring diagrams and system schematics
- Apply safety procedures and code requirements
- Use HVAC/R tools and instruments for troubleshooting
- Perform routine maintenance and system checks

--- Program‑Specific Skills ---

Include skills such as:

- Refrigeration system diagnostics
- Air conditioning service and repair
- Electrical troubleshooting
- Brazing and piping fundamentals
- System installation and startup
- Preventive maintenance
- Safety and code compliance

--- Program‑Specific Tools ---

Students may have experience with:

- Refrigeration gauges and manifolds
- Multimeters and electrical testers
- Vacuum pumps and recovery machines
- Thermometers and airflow meters
- Hand and power tools used in HVAC/R service

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Diagnosed faults in refrigeration or A/C training systems
- Performed system evacuation and refrigerant charging
- Completed wiring and electrical troubleshooting exercises
- Installed or serviced residential/light commercial HVAC/R components
- Conducted preventive maintenance inspections

--- Program‑Specific Certifications ---

Include only if earned:

- EPA Section 608 (if student provides proof)
- Any student‑provided HVAC/R certifications

--- Summary Keywords for Refrigeration & A/C Students ---

HVAC/R, Refrigeration, Air conditioning, Diagnostics, Electrical systems, Installation, Maintenance

--- Work History Emphasis ---

When describing work experience for HVAC/R students, highlight:

- Mechanical aptitude
- Diagnostic accuracy
- Safety and code compliance
- Reliability and attention to detail
- Hands‑on service experience



===== PROGRAM: Refrigeration & Climate Control — East Liverpool Campus (East Liverpool, OH) =====

This program block applies ONLY when the student’s selected program exactly matches:
"Refrigeration & Climate Control — East Liverpool Campus (East Liverpool, OH)"

--- Program Purpose ---

This program prepares students for entry‑level roles in heating, ventilation, air conditioning, and refrigeration (HVAC/R). Training emphasizes installation, troubleshooting, and repair of residential and commercial heating, cooling, and refrigeration systems. Students gain hands‑on experience working with real equipment and industry‑standard tools.

--- Core Focus Areas ---

- Heating, ventilation, air conditioning, and refrigeration systems
- Residential and commercial equipment operation
- Electrical systems for HVAC/R
- Refrigeration cycle and system components
- Troubleshooting and diagnostics
- Safety procedures and industry standards

--- Competencies Developed ---

Students completing this program should be able to:

- Install, maintain, and repair HVAC/R systems
- Diagnose heating, cooling, and refrigeration issues
- Interpret wiring diagrams and system schematics
- Perform refrigerant recovery, evacuation, and charging
- Apply safety procedures and follow mechanical/electrical codes
- Conduct preventive maintenance on HVAC/R equipment

--- Program‑Specific Skills ---

Include skills such as:

- HVAC/R diagnostics
- Refrigeration system service
- Air conditioning repair
- Electrical troubleshooting
- System installation and startup
- Preventive maintenance
- Safety and code compliance

--- Program‑Specific Tools ---

Students may have experience with:

- Refrigeration gauges and manifolds
- Multimeters and electrical testers
- Recovery machines and vacuum pumps
- Thermometers, airflow meters, and leak detectors
- Hand and power tools used in HVAC/R service

--- Program‑Specific Project Examples ---

Use when the student has limited work history or strong hands‑on experience:

- Diagnosed faults in heating, cooling, or refrigeration systems
- Performed refrigerant recovery and system evacuation
- Completed wiring and electrical troubleshooting exercises
- Installed or serviced residential/light commercial HVAC/R components
- Conducted preventive maintenance inspections

--- Program‑Specific Certifications ---

Include only if earned:

- EPA Section 608 (if student provides proof)
- Any student‑provided HVAC/R certifications

--- Summary Keywords for Refrigeration & Climate Control Students ---

HVAC/R, Refrigeration, Climate control, Heating and cooling, Diagnostics, Electrical systems, Installation, Maintenance

--- Work History Emphasis ---

When describing work experience for these students, highlight:

- Mechanical aptitude
- Diagnostic accuracy
- Safety and code compliance
- Reliability and attention to detail
- Hands‑on service experience
`;

