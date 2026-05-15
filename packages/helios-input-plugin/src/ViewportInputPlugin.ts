import { Context, Plugin, SUPPORTED_HELIOS_PLUGIN_API } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import { VIEWPORT_INPUT_CAPABILITY, ViewportInputState } from "./ViewportInputCapability";
import { ViewportInputBridge } from "./ViewportInputBridge";

export class ViewportInputPlugin extends Plugin {
    public readonly id = "helios.input";
    public readonly version = "0.0.1";
    public readonly enginePluginApi = SUPPORTED_HELIOS_PLUGIN_API;
    public readonly requires = [{ capability: THREE_RENDERER_CAPABILITY }];
    public readonly provides = [VIEWPORT_INPUT_CAPABILITY];

    private readonly state = new ViewportInputState();
    private bridge?: ViewportInputBridge;

    public setup(context: Context): void {
        super.setup(context);
        const rc = context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        const gameCanvas = rc.getGameCanvas();
        if (!gameCanvas) {
            console.warn("[ViewportInputPlugin] Game canvas not found; viewport input disabled.");
            context.capabilities.register(VIEWPORT_INPUT_CAPABILITY, this.state);
            return;
        }
        this.bridge = new ViewportInputBridge(context, this.state);
        this.bridge.attach(gameCanvas);
        context.capabilities.register(VIEWPORT_INPUT_CAPABILITY, this.state);
    }

    public dispose(): void {
        this.bridge?.detach();
        this.bridge = undefined;
        this.getContext().capabilities.delete(VIEWPORT_INPUT_CAPABILITY);
        super.dispose();
    }
}
