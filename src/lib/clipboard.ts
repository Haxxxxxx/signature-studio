/** Collapse inter-tag whitespace and strip comments for a tighter export. */
export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Copy rich HTML to the clipboard so pasting into Gmail keeps formatting. */
export async function copyRichHtml(html: string): Promise<void> {
  const plain = html.replace(/<[^>]+>/g, "");
  if (
    typeof ClipboardItem !== "undefined" &&
    navigator.clipboard &&
    "write" in navigator.clipboard
  ) {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plain], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
    return;
  }
  // Fallback: selection-based copy of a hidden rendered node.
  const holder = document.createElement("div");
  holder.contentEditable = "true";
  holder.style.position = "fixed";
  holder.style.left = "-9999px";
  holder.innerHTML = html;
  document.body.appendChild(holder);
  const range = document.createRange();
  range.selectNodeContents(holder);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  document.execCommand("copy");
  sel?.removeAllRanges();
  document.body.removeChild(holder);
}

/** Copy plain text (the raw HTML source). */
export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Trigger a file download in the browser. */
export function downloadFile(filename: string, content: string, type = "text/html") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
