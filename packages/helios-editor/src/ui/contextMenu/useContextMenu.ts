import { onUnmounted, ref, shallowRef, type ShallowRef } from "vue";
import type { ContextMenuItem } from "./contextMenuTypes";

/**
 * Minimal floating context menu controller: open at screen coords, close on Escape / outside click / scroll / resize.
 */
export function useContextMenu() {
    const visible = ref(false);
    const x = ref(0);
    const y = ref(0);
    const items: ShallowRef<ContextMenuItem[]> = shallowRef([]);

    let detachGlobalListeners: (() => void) | null = null;

    function close(): void {
        visible.value = false;
        items.value = [];
        detachGlobalListeners?.();
        detachGlobalListeners = null;
    }

    function open(clientX: number, clientY: number, nextItems: ContextMenuItem[]): void {
        close();
        x.value = clientX;
        y.value = clientY;
        items.value = nextItems;
        visible.value = true;

        const attach = (): void => {
            const onPointerDown = (ev: PointerEvent): void => {
                const path = ev.composedPath();
                const hitMenu = path.some(
                    (n) => n instanceof HTMLElement && n.dataset.contextMenuRoot === "true",
                );
                if (!hitMenu) {
                    close();
                }
            };
            const onKeyDown = (ev: KeyboardEvent): void => {
                if (ev.key === "Escape") {
                    ev.preventDefault();
                    close();
                }
            };
            const onScrollOrResize = (): void => {
                close();
            };

            document.addEventListener("pointerdown", onPointerDown, true);
            window.addEventListener("keydown", onKeyDown, true);
            window.addEventListener("scroll", onScrollOrResize, true);
            window.addEventListener("resize", onScrollOrResize);

            detachGlobalListeners = (): void => {
                document.removeEventListener("pointerdown", onPointerDown, true);
                window.removeEventListener("keydown", onKeyDown, true);
                window.removeEventListener("scroll", onScrollOrResize, true);
                window.removeEventListener("resize", onScrollOrResize);
            };
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(attach);
        });
    }

    onUnmounted(() => {
        close();
    });

    return { visible, x, y, items, open, close };
}
