import {
    EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
    type EditorShellActiveViewState,
    System,
} from "@merlinn/helios-core";
import { getThreeRenderContext } from "../ThreeRenderContext";

export class RenderSystem extends System {
    static override readonly runsInEditor = true;

    async start(): Promise<void> {
        const rc = getThreeRenderContext(this.context);
        rc.syncEditorViewportSize();
        rc.syncGameViewportSize();
    }

    update(deltaTime: number) {
        const renderContext = getThreeRenderContext(this.context);
        const shell = this.context.capabilities.getOrUndefined<EditorShellActiveViewState>(
            EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
        );
        const active = shell?.activeView ?? "editor";

        if (active === "editor") {
            renderContext.renderEditorViewport(this.world);
        } else {
            renderContext.renderGameViewport();
        }
    }
}
