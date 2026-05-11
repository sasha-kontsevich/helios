import {
  EDITOR_ENTITY_CLIPBOARD_MIME,
  parseEditorEntityClipboardJson,
  type EditorEntityClipboardV1,
} from "@merlinn/helios-core";

/**
 * Browser clipboard integration for {@link EditorEntityClipboardV1}.
 * Falls back to `text/plain` JSON when custom MIME types are unsupported.
 */

export function getLastLocalClipboardJson(): string | null {
  return lastLocalJson;
}

let lastLocalJson: string | null = null;

export function rememberLocalClipboardJson(json: string): void {
  lastLocalJson = json;
}

export async function writeEditorEntityClipboard(json: string): Promise<void> {
  rememberLocalClipboardJson(json);
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      const plain = new Blob([json], { type: "text/plain" });
      const rich = new Blob([json], { type: EDITOR_ENTITY_CLIPBOARD_MIME });
      await navigator.clipboard.write([
        new ClipboardItem({
          [EDITOR_ENTITY_CLIPBOARD_MIME]: rich,
          "text/plain": plain,
        }),
      ]);
      return;
    }
  } catch {
    // fall through
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(json);
  }
}

export async function readEditorEntityClipboardJson(): Promise<string | null> {
  try {
    if (navigator.clipboard?.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes(EDITOR_ENTITY_CLIPBOARD_MIME)) {
          const blob = await item.getType(EDITOR_ENTITY_CLIPBOARD_MIME);
          return await blob.text();
        }
        if (item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          return await blob.text();
        }
      }
    }
  } catch {
    // fall through
  }
  try {
    if (navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch {
    // ignore
  }
  return lastLocalJson;
}

export function tryParseEditorEntityClipboardJson(
  text: string | null | undefined,
): EditorEntityClipboardV1 | null {
  if (text == null || text.trim() === "") return null;
  try {
    return parseEditorEntityClipboardJson(text);
  } catch {
    return null;
  }
}
