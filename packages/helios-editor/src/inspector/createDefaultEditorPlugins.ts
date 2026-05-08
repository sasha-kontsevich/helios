import type { EditorPlugin } from "../EditorPlugin";
import { InspectorEditorPlugin } from "./InspectorEditorPlugin";

export function createDefaultEditorPlugins(): EditorPlugin[] {
    return [new InspectorEditorPlugin()];
}
