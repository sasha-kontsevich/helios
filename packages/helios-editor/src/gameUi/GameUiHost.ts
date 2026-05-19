import type { EditorShellActiveView, EngineAPI } from "@merlinn/helios-core";
import type { PlayModeController } from "../play/PlayModeController";
import type { GameUiContext } from "./GameUiContext";
import type { GameUiPlugin } from "./GameUiPlugin";

export class GameUiHost {
    private mountEl: HTMLElement | null = null;
    private activeView: EditorShellActiveView = "editor";
    private readonly activeViewListeners = new Set<(view: EditorShellActiveView) => void>();
    private mountedPlugins: GameUiPlugin[] = [];

    constructor(
        private readonly api: EngineAPI,
        private readonly playMode: PlayModeController,
        private readonly plugins: readonly GameUiPlugin[],
    ) {}

    getActiveView(): EditorShellActiveView {
        return this.activeView;
    }

    subscribeActiveView(listener: (view: EditorShellActiveView) => void): () => void {
        listener(this.activeView);
        this.activeViewListeners.add(listener);
        return () => {
            this.activeViewListeners.delete(listener);
        };
    }

    notifyActiveView(view: EditorShellActiveView): void {
        if (this.activeView === view) {
            return;
        }
        this.activeView = view;
        for (const listener of this.activeViewListeners) {
            listener(view);
        }
    }

    attachMount(el: HTMLElement): void {
        if (this.mountEl) {
            this.detach();
        }
        this.mountEl = el;
        const context = this.createContext(el);
        this.mountedPlugins = [...this.plugins];
        for (const plugin of this.mountedPlugins) {
            const result = plugin.setup(context);
            if (result instanceof Promise) {
                void result.catch((err) => {
                    console.error(`[GameUiHost] Plugin "${plugin.id}" setup failed:`, err);
                });
            }
        }
    }

    detach(): void {
        for (let i = this.mountedPlugins.length - 1; i >= 0; i--) {
            this.mountedPlugins[i].dispose?.();
        }
        this.mountedPlugins = [];
        this.mountEl = null;
    }

    dispose(): void {
        this.detach();
        this.activeViewListeners.clear();
    }

    private createContext(root: HTMLElement): GameUiContext {
        return {
            api: this.api,
            root,
            getActiveView: () => this.activeView,
            subscribeActiveView: (listener) => this.subscribeActiveView(listener),
            playMode: this.playMode,
        };
    }
}
