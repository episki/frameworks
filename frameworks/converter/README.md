This folder contains two TypeScript scripts that convert external security and compliance frameworks into the **Episki Security Format (ESF)** used by the Episki application.

Supported conversions:
- **OSCAL → Episki**
- **SCF (Secure Controls Framework) → Episki**

Ensure your JSON has consistent column names before converting.

1. Dependencies
Node.js
Required version: 16+
Download: https://nodejs.org/
Bun
Files
Place all input JSON files in the same folder as the scripts.

2. Running the Converters
OSCAL → Episki
bun Oscal-to-Episki.ts SP800-53.json
SCF → Episki
bun SCF-to-Episki.ts SCF.json
Each script generates the output:
output-episki.json

4. Expected Environment
This project expects:
Node.js installed and accessible from terminal
Ability to run bun
Input JSON provided locally
