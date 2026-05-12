import { System } from "@merlinn/helios-core";
import { getThreeRenderContext } from "../ThreeRenderContext";

export class RenderSystem extends System {
    async start(): Promise<void> {
        getThreeRenderContext(this.context).syncViewportSize();
    }

    update(deltaTime: number) {
        const renderContext = getThreeRenderContext(this.context);
        const camera = renderContext.resolveRenderCamera(this.world);

        if (!camera) {
            return;
        }

        renderContext.syncViewportSize();
        renderContext.invokeBeforeRender();
        renderContext.getRenderer().render(renderContext.getScene(), camera);
    }
}
