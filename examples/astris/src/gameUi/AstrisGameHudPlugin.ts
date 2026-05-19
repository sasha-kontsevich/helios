import type { GameUiContext, GameUiPlugin } from "@merlinn/helios-editor";
import { createApp, type App } from "vue";
import AstrisGameHud from "./AstrisGameHud.vue";

export class AstrisGameHudPlugin implements GameUiPlugin {
    readonly id = "astris.gameHud";

    private app: App | null = null;

    setup(context: GameUiContext): void {
        this.app = createApp(AstrisGameHud, {
            engineApi: context.api,
            playMode: context.playMode,
            getActiveView: context.getActiveView,
            subscribeActiveView: context.subscribeActiveView,
        });
        this.app.mount(context.root);
    }

    dispose(): void {
        this.app?.unmount();
        this.app = null;
    }
}
