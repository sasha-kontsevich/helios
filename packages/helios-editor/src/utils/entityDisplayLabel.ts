import type { EntitySnapshot } from "@merlinn/helios-core";

/** Trimmed {@link Name.label}, or empty string. */
export function entityNameOnly(ent: EntitySnapshot): string {
  const nameComp = ent.components.Name as Record<string, unknown> | undefined;
  const label =
    nameComp && typeof nameComp.label === "string" ? nameComp.label.trim() : "";
  return label;
}

/** Prefer {@link Name.label}; fallback to `#eid` for HUD / compact labels. */
export function entityDisplayLabel(ent: EntitySnapshot): string {
  const label = entityNameOnly(ent);
  if (label.length > 0) return label;
  return `#${ent.eid}`;
}