/** Margin from window edges when clamping `position: fixed` menus (px). */
export const VIEWPORT_MARGIN = 8;

/**
 * Clamp top-left of a fixed-position box so it stays inside the browser viewport.
 */
export function clampFixedMenuPosition(
    preferredLeft: number,
    preferredTop: number,
    menuWidth: number,
    menuHeight: number,
): { left: number; top: number } {
    if (typeof window === "undefined") {
        return { left: preferredLeft, top: preferredTop };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = VIEWPORT_MARGIN;
    let left = preferredLeft;
    let top = preferredTop;
    if (left + menuWidth > vw - m) {
        left = vw - m - menuWidth;
    }
    if (top + menuHeight > vh - m) {
        top = vh - m - menuHeight;
    }
    if (left < m) {
        left = m;
    }
    if (top < m) {
        top = m;
    }
    return { left, top };
}
