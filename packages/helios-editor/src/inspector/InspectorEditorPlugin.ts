import { createApp } from "vue";
import type { App } from "vue";
import type { EditorContext } from "../EditorContext";
import type { EditorPlugin } from "../EditorPlugin";
import EditorShell from "./EditorShell.vue";

export class InspectorEditorPlugin implements EditorPlugin {
    readonly id = "helios.inspector";

    private app: App | null = null;

    setup(context: EditorContext): void {
        this.app = createApp(EditorShell, {
            engineApi: context.api,
            selection: context.selection,
            transformTools: context.transformTools ?? null,
            inspectorRegistry: context.inspectorRegistry,
        });
        this.app.mount(context.root);
    }

    dispose(): void {
        this.app?.unmount();
        this.app = null;
    }
}
