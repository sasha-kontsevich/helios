import { Context, Plugin, SUPPORTED_HELIOS_PLUGIN_API } from "@merlinn/helios-core";
import {
    THREE_RENDERER_CAPABILITY,
    ThreePluginOptions,
    ThreeRenderContext,
} from "./ThreeRenderContext";

export class ThreePlugin extends Plugin {
    public readonly id = "helios.three";
    public readonly version = "0.0.1";
    public readonly enginePluginApi = SUPPORTED_HELIOS_PLUGIN_API;
    public readonly provides = [THREE_RENDERER_CAPABILITY] as const;

    private readonly options: ThreePluginOptions;
    private renderContext?: ThreeRenderContext;

    constructor(options: ThreePluginOptions) {
        super();
        this.options = options;
    }

    public setup(context: Context): void {
        super.setup(context);
        this.renderContext = new ThreeRenderContext(this.options);
        this.renderContext.init();
        context.capabilities.register(THREE_RENDERER_CAPABILITY, this.renderContext);
    }

    public dispose(): void {
        if (this.renderContext) {
            this.renderContext.dispose();
            this.getContext().capabilities.delete(THREE_RENDERER_CAPABILITY);
        }
        this.renderContext = undefined;
        super.dispose();
    }
}
