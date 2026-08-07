/** Configuration keys used by the optional local title worker. */
export const ONLINE_TINY_TITLE_MODEL_KEY = "online";

export function isTinyTitleLocalModelKey(modelKey: string | undefined): modelKey is string {
	return modelKey !== undefined && (modelKey.startsWith("local:") || modelKey.startsWith("tiny:"));
}
