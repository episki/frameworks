// convert-to-episki.ts
import fs from 'fs'

function safeGetId(ctrl) {
  return ctrl.id || ctrl['control-id'] || ctrl.controlId || ctrl.label || ctrl.uid || ''
}
function safeGetTitle(ctrl) {
  return ctrl.title || ctrl.label || ctrl.name || safeGetId(ctrl) || ''
}
function getPartText(parts) {
  if (!Array.isArray(parts)) return ''
  const names = ['statement', 'description', 'prose', 'guidance', 'statement-prose']
  for (const n of names) {
    const p = parts.find(x => x?.name === n)
    if (p?.prose) return p.prose
  }
  const first = parts.find(x => x?.prose)
  return first?.prose || ''
}
function escapeHtml(s) {
  if (!s && s !== 0) return ''
  const str = String(s)
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function convertOscalControlToEpiski(ctrl) {
  const id = safeGetId(ctrl)
  const title = safeGetTitle(ctrl)
  const description = getPartText(ctrl.parts) || ctrl.prose || ctrl.description || ''

  const children = (ctrl.controls || []).map(convertOscalControlToEpiski)

  return {
    ref: id,
    control: `<p>${escapeHtml(title)}</p>`,
    description: `<p>${escapeHtml(description)}</p>`,
    testingProcedures: [],
    controls: children,
  }
}

function extractFromCatalog(catalog) {
  const groups = catalog?.groups || []
  const out = []

  for (const g of groups) {
    const groupControls = []

    if (Array.isArray(g.controls)) {
      for (const c of g.controls) groupControls.push(convertOscalControlToEpiski(c))
    }
    if (Array.isArray(g.groups)) {
      for (const sg of g.groups) {
        if (Array.isArray(sg.controls)) {
          for (const c of sg.controls) groupControls.push(convertOscalControlToEpiski(c))
        }
      }
    }

    const groupNode = {
      ref: g.id || (g.title ? `group-${g.title.replace(/\s+/g, '-').toLowerCase()}` : ''),
      control: `<p>${escapeHtml(g.title || g.id || '')}</p>`,
      description: '', // opcional: puedes extraer g.parts si existen
      testingProcedures: [],
      controls: groupControls,
    }

    out.push(groupNode)
  }

  if (Array.isArray(catalog.controls) && catalog.controls.length) {
    for (const c of catalog.controls) out.push(convertOscalControlToEpiski(c))
  }

  return out
}

function buildEpiskiObjectFromInput(json) {
  if (json?.catalog) {
    console.log('Detected: OSCAL catalog')
    const controls = extractFromCatalog(json.catalog)
    return { controls }
  }

  if (Array.isArray(json) && json.length && typeof json[0].id === 'string') {
    console.log('Detected: Array of controls (SCF-style)')
    const mapped = json.map(it => ({
      ref: it.id || it.control_id || it.controlId || '',
      control: `<p>${escapeHtml(it.title || it.name || it.control || '')}</p>`,
      description: `<p>${escapeHtml(it.description || it.prose || '')}</p>`,
      testingProcedures: [],
      controls: [],
    }))
    return { controls: mapped }
  }

  if (json?.controls && Array.isArray(json.controls)) {
    console.log('Detected: .controls root')
    const mapped = json.controls.map(c => convertOscalControlToEpiski(c))
    return { controls: mapped }
  }

  if (json?.catalog?.groups) {
    const controls = extractFromCatalog(json.catalog)
    return { controls }
  }

  throw new Error('Formato de entrada no reconocido para conversión a Episki')
}

// === MAIN ===
function main() {
  try {
    const fp = process.argv[2]
    if (!fp) {
      console.error('Usage: bun convert-to-episki.js <file.json>')
      process.exit(1)
    }
    console.log('Reading File', fp)
    const raw = fs.readFileSync(fp, 'utf8')
    const json = JSON.parse(raw)

    const episkiObj = buildEpiskiObjectFromInput(json)

    const outName = 'episki_output.json'
    fs.writeFileSync(outName, JSON.stringify(episkiObj, null, 2), 'utf8')
    console.log('Gerenrated', outName)
    console.log('Controls generated', episkiObj.controls.length)
  }
  catch (err) {
    console.error('Error:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

main()
