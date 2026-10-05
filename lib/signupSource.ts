/** Spellings that arrive for the same channel, after cleaning (so the
 *  "chatgpt.com" that ChatGPT puts in utm_source arrives as "chatgptcom"). */
const SOURCE_ALIASES: Record<string, string> = {
  chatgptcom: "chatgpt",
  chatopenaicom: "chatgpt",
  openai: "chatgpt",
  geminigooglecom: "gemini",
  bard: "gemini",
  claudeai: "claude",
  perplexityai: "perplexity",
  copilotmicrosoftcom: "copilot",
};

/** Free text from the client, clamped before it reaches Firestore, then
 *  folded onto one code per channel. Also applied when reading, so signups
 *  stored before an alias existed group with the rest. */
export function cleanSource(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return SOURCE_ALIASES[cleaned] ?? cleaned;
}
