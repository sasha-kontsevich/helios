/**
 * Leaf entry in a floating context menu (executable action).
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

/**
 * Nested submenu (flyout on hover); children must be leaf items.
 */
export interface ContextMenuSubmenu {
    id: string;
    label: string;
    disabled?: boolean;
    children: ContextMenuItem[];
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSubmenu;

export function isContextMenuSubmenu(e: ContextMenuEntry): e is ContextMenuSubmenu {
    return "children" in e && Array.isArray((e as ContextMenuSubmenu).children);
}
