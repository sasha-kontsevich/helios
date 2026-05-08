import { Context, Plugin } from "@merlinn/helios-core";
import {
    setThreeRenderContext,
    ThreePluginOptions,
    ThreeRenderContext,
} from "./ThreeRenderContext";

export class ThreePlugin extends Plugin {

    public name: string = 'Three';
    private readonly options: ThreePluginOptions;
    private renderContext?: ThreeRenderContext;

    constructor(options: ThreePluginOptions) {
        super();
        this.options = options;
    }

    public setup(context: Context) {
        super.setup(context);
        this.renderContext = new ThreeRenderContext(this.options);
        this.renderContext.init();
        setThreeRenderContext(context, this.renderContext);
    }
}
