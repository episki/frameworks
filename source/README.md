Episki Framework Converters
This folder contains a JavaScript-based converter that transforms external security frameworks into the Episki Security Format (ESF) required by the Episki application.

NIST OSCAL Catalogs (e.g., SP 800-53, 800-171, CSF 2.0)	Oscal-to-Episki.ts	JSON (OSCAL XML/JSON converted to JSON)

1. ⚙️ Requirements
You must install the following tools:
Node.js

Required version: 16+
Download: https://nodejs.org/

Files

All input JSON files must be placed in the same directory as the converter scripts.

2. 📥 Obtaining Original Framework Files
🔹 Where to get OSCAL JSON catalogs

Official NIST OSCAL repository:
👉 https://github.com/usnistgov/OSCAL

OSCAL catalogs (JSON files) are in:

/nist.gov/OSCAL-content/content/NIST/


Direct examples:

Framework	OSCAL JSON File
NIST SP 800-53 Rev5	/NIST_SP-800-53_rev5/json/NIST_SP-800-53_rev5_catalog.json
NIST SP 800-171 Rev3	/NIST_SP-800-171_rev3/json/NIST_SP-800-171_rev3_catalog.json
NIST Cybersecurity Framework 2.0	/NIST_CSF/json/NIST_CSF_2.0.json
NIST SP 800-218 (SSDF)	/NIST_SP-800-218/json/...

Download them into your local folder.

3. ▶️ Running the Converters
Convert OSCAL → Episki
node Oscal-to-Episki.ts SP800-53.json

Output
Each script generates a new file:

<originalName>-episki.json

Example:

Input:  SP800-53.json
Output: SP800-53-episki.json

4. 📦 Expected Folder Structure
/your-folder/
│
├── Oscal-to-Episki.ts
├── SP800-53.json      ← Input
│
└── SP800-53-episki.json   ← Output

5. 🧩 Script Behavior
OSCAL → Episki

Extracts controls from catalog.groups[] and catalog.controls[]

Normalizes:

id → ref

title → control

extracts text from .description[0].text

Ensures Episki output structure:

{
  ref: string,
  control: string,
  description: string,
  testingProcedures: [],
  controls: []
}

SCF → Episki

Accepts JSON produced by exporting .xlsx SCF sheets

Supports flexible column names:

"SCF Identifier"

"SCF Domain"

"Principle Intent"

"Cybersecurity & Data Privacy by Design (C|P) Principles"

6. 🔧 Development Notes

No external NPM dependencies are required.

The script runs under Node.