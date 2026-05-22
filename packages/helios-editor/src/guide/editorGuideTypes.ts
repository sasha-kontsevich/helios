export interface EditorGuideSection {
    id: string;
    title: string;
    bullets: string[];
}

export interface EditorWelcomeGuideOptions {
    /** @default true */
    enabled?: boolean;
    /** @default true */
    showOnFirstVisit?: boolean;
    /** Replaces built-in sections when set. */
    sections?: EditorGuideSection[];
    /** Appended after built-in sections (or after `sections` if only extra is used with defaults). */
    extraSections?: EditorGuideSection[];
    /** @default helios.editor.guideDismissed.v1 */
    storageKey?: string;
}
