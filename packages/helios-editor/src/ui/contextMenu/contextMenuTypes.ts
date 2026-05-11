/**
 * Single entry in a floating context menu (see {@link useContextMenu} / {@link ContextMenu}).
 */
export interface ContextMenuItem {
    id: string;
    label: string;
    disabled?: boolean;
    /** Emphasize destructive actions (e.g. delete). */
    danger?: boolean;
    /** Shown for decoration only (e.g. "Ctrl+C"). */
    shortcut?: string;
    onSelect: () => void;
}
