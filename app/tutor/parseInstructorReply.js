const HIGHLIGHT_TAG = /\[HIGHLIGHT:([\w-]+)\]\s*$/;

export function parseInstructorReply(raw) {
  const text = raw?.trim() || "";
  const match = text.match(HIGHLIGHT_TAG);
  const highlightId = match?.[1] || null;
  const content = text.replace(HIGHLIGHT_TAG, "").trim();
  return { content, highlightId };
}
