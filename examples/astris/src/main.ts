import {Engine} from "@merlinn/helios-core";
import {initSystems} from "./systems";
import {initComponents} from "./components";
import {initBuilders} from "./builders";

const engine = new Engine();

engine.init([])
    .then(() => {
        const context = engine.getContext();

        initComponents(context);
        initBuilders(context);
        initSystems(context);

        engine.start();
    });

