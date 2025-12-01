// convert-scf-to-episki.ts
import { readFile, writeFile } from 'fs/promises'

function safe(value: any): string {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

function toHtml(text: string): string {
  return `<p>${text}</p>`
}

async function main() {
  const inputPath = Bun.argv[2]
  const outputPath = Bun.argv[3] ?? 'episki_scf.json'

  if (!inputPath) {
    console.error('Usage: bun SCF-to-episki.ts <SCF.json> [output.json]')
    process.exit(1)
  }

  let raw
  try {
    raw = await readFile(inputPath, 'utf8')
  }
  catch {
    console.error('Could not read input file')
    process.exit(1)
  }

  let rows
  try {
    rows = JSON.parse(raw)
  }
  catch {
    console.error('Input JSON is invalid')
    process.exit(1)
  }

  if (!Array.isArray(rows)) {
    console.error('SCF must be an array of rows from XLSX')
    process.exit(1)
  }

  const controls = rows
    .map((row: any) => {
      const ref = safe(row['SCF Identifier'])
      const title = safe(row['Cybersecurity & Data Privacy by Design (C|P) Principles'])
      const description = safe(row['Principle Intent'])

      if (!ref || !title) return null // skip blanks

      return {
        ref,
        control: toHtml(title),
        description,
        testingProcedures: [],
        controls: [],
      }
    })
    .filter(Boolean)

  if (controls.length === 0) {
    console.error('No SCF rows were converted. Check field names.')
    process.exit(1)
  }

  const episkiOutput = {
    name: 'SCF Imported',
    version: '1.0',
    controls,
  }

  await writeFile(outputPath, JSON.stringify(episkiOutput, null, 2), 'utf8')
  console.log(`SCF converted successfully → ${outputPath}`)
}

main()
