import { addComponent, addEntity, removeEntity } from "bitecs";
import { Context, Plugin, SUPPORTED_HELIOS_PLUGIN_API } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import { VIEWPORT_INPUT_CAPABILITY } from "./ViewportInputCapability";
import { ViewportInput } from "./components/ViewportInput";
import { ViewportInputBridge } from "./ViewportInputBridge";

export class ViewportInputPlugin extends Plugin {
    public readonly id = "helios.input";
    public readonly version = "0.0.1";
    public readonly enginePluginApi = SUPPORTED_HELIOS_PLUGIN_API;
    public readonly requires = [{ capability: THREE_RENDERER_CAPABILITY }];
    public readonly provides = [VIEWPORT_INPUT_CAPABILITY];

    private inputEntity: number | null = null;
    private bridge?: ViewportInputBridge;

    public setup(context: Context): void {
        super.setup(context);
        if (!context.components.has("ViewportInput" as never)) {
            context.components.register("ViewportInput" as never, ViewportInput as never);
        }

        const eid = addEntity(context.ecsWorld);
        addComponent(context.ecsWorld, ViewportInput, eid);
        ViewportInput.enabled[eid] = 0;
        ViewportInput.keys[eid] = 0;
        ViewportInput.buttons[eid] = 0;
        ViewportInput.lookDeltaX[eid] = 0;
        ViewportInput.lookDeltaY[eid] = 0;
        this.inputEntity = eid;

        context.capabilities.register(VIEWPORT_INPUT_CAPABILITY, { inputEntity: eid });

        const rc = context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        const gameCanvas = rc.getGameCanvas();
        if (!gameCanvas) {
            console.warn("[ViewportInputPlugin] Game canvas not found; viewport input disabled.");
            return;
        }
        this.bridge = new ViewportInputBridge(context, eid);
        this.bridge.attach(gameCanvas);
    }

    public dispose(): void {
        this.bridge?.detach();
        this.bridge = undefined;
        const eid = this.inputEntity;
        if (eid !== null) {
            removeEntity(this.getContext().ecsWorld, eid);
        }
        this.inputEntity = null;
        this.getContext().capabilities.delete(VIEWPORT_INPUT_CAPABILITY);
        super.dispose();
    }
}
