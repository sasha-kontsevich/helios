import { System } from "@merlinn/helios-core";
import { clearThreeRenderContext, getThreeRenderContext } from "../ThreeRenderContext";

export class RenderSystem extends System {
    async start(): Promise<void> {
        getThreeRenderContext(this.context).syncViewportSize();
    }

    update(deltaTime: number) {
        const renderContext = getThreeRenderContext(this.context);
        const camera = renderContext.getActiveCamera();

        if (!camera) {
            return;
        }

        renderContext.syncViewportSize();
        renderContext.getRenderer().render(renderContext.getScene(), camera);
    }

    stop(): void {
        const renderContext = getThreeRenderContext(this.context);
        renderContext.dispose();
        clearThreeRenderContext(this.context);
    }
}
