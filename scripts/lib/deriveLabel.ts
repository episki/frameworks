/**
 * A label for a control the source publishes without a title.
 *
 * Statutes and regulations (GDPR, DORA, NIS2, CCPA, the GLBA Safeguards Rule,
 * HIPAA) title their articles and sections but not the paragraphs beneath them.
 * episki shows a control's label as its name and falls back to the ref when
 * there is none, so an untitled paragraph read "Article 5.1(a) | Article 5.1(a)".
 *
 * Every rule here takes its words from the requirement text itself; nothing is
 * paraphrased or invented. In order:
 *
 *   1. The paragraph's own heading, where the source prints one in front of the
 *      text (CFR style: "Information security program. You shall …",
 *      "Standard: Health care component. If a covered entity …").
 *   2. A lead-in that only introduces its sub-paragraphs ("Personal data shall
 *      be:") says nothing alone, so it takes its parent's label.
 *   3. The term the paragraph defines, where it names one in quotes
 *      (GDPR 5.1(a) "… (‘lawfulness, fairness and transparency’)").
 *   4. Otherwise its opening words, up to the first clause break, shortened at
 *      a word boundary.
 */

const MAX_LENGTH = 72;

/** CFR prefixes that tag a paragraph's role rather than name it. */
const ROLE_PREFIX = /^(?:Standard|Implementation specifications?)(?:\s*\((?:Required|Addressable)\))?\s*:\s*/;

/** Words that make a leading phrase a sentence rather than a heading. */
const SENTENCE_WORDS = /\b(?:shall|must|may|will|should|can|is|are|was|were|has|have|means|includes?|applies|apply|does|do)\b/i;

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function tidy(text: string): string {
  return text.replace(/\s+/g, " ").replace(/[\s,;:.—–-]+$/u, "").trim();
}

function shorten(text: string): string {
  if (text.length <= MAX_LENGTH) return text;
  const cut = text.slice(0, MAX_LENGTH + 1);
  const space = cut.lastIndexOf(" ");
  return `${tidy(cut.slice(0, space > 20 ? space : MAX_LENGTH))}…`;
}

/** Rule 1: a short heading printed ahead of the paragraph text. */
function heading(text: string): string | null {
  const role = text.match(ROLE_PREFIX);
  const rest = role ? text.slice(role[0].length) : text;
  if (role && rest.trim() === "") {
    // "Implementation specifications:" with the specifications as children.
    return tidy(role[0].replace(/\s*\((?:Required|Addressable)\)/, ""));
  }
  const match = rest.match(/^([A-Z][^.:;]{1,80}?)[.:]\s+(?=\S)/);
  if (!match) return null;
  const candidate = tidy(match[1]!);
  const words = candidate.split(" ");
  if (words.length > 8 || SENTENCE_WORDS.test(candidate)) return null;
  // A heading is a noun phrase: no clause commas past the first word or two.
  if ((candidate.match(/,/g) ?? []).length > 1) return null;
  return candidate;
}

/** Rule 2: text that only introduces its sub-paragraphs. */
function isLeadIn(text: string, hasChildren: boolean): boolean {
  return hasChildren && /:\s*$/.test(text) && text.length <= 200;
}

/** Rule 3: the quoted term a paragraph defines, e.g. GDPR's principles. */
function definedTerm(text: string): string | null {
  const match = text.match(/\(\s*[‘'"“]([^’'"”]{3,80})[’'"”]\s*\)/u);
  return match ? sentenceCase(tidy(match[1]!)) : null;
}

/** Rule 4: the opening words, to the first clause break. */
function openingWords(text: string): string {
  const stripped = text.replace(/^\(?[a-z0-9ivx]{1,5}\)\s*/i, "");
  const clause = stripped.split(/(?<=[.;:])\s|;\s|:\s/u)[0] ?? stripped;
  return shorten(sentenceCase(tidy(clause)));
}

export interface LabelInput {
  description?: string | null;
  hasChildren: boolean;
  parentLabel?: string | null;
}

/** The label for an untitled control, or null when it has no text to use. */
export function deriveLabel({ description, hasChildren, parentLabel }: LabelInput): string | null {
  const text = (description ?? "").replace(/\s+/g, " ").trim();
  if (!text) return parentLabel ?? null;
  const fromHeading = heading(text);
  if (fromHeading) return shorten(fromHeading);
  if (isLeadIn(text, hasChildren) && parentLabel) return parentLabel;
  return definedTerm(text) ?? openingWords(text);
}
