import {Engine} from "@merlinn/helios-core";
import {initSystems} from "./systems";
import {initBuilders} from "./builders";
import * as Components from "./components";
// @ts-ignore
import * as ThreeComponents from '@merlinn/helios-three-plugin/components'

const engine = new Engine();

engine.init([])
    .then(() => {
        const context = engine.getContext();
        context.components.registerAll(ThreeComponents);
        context.components.registerAll(Components);
        initBuilders(context);
        initSystems(context);

        engine.start();
    });

