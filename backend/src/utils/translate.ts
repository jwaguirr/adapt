import translate from "google-translate-api-x";

/**
 * Translate text into the given target language
 * @param text The text to translate
 * @param target Locale code like "en", "es", "fr", "zh-CN"
 */
export async function translateText(
  text: string,
  target: string = "es"
): Promise<string> {
  try {
    const res = await translate(text, { to: target });
    return res.text;
  } catch (err) {
    console.error("Translation error:", err);
    return text; // fallback: return original text
  }
}
