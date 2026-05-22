import { DEFAULT_EDITOR_GUIDE_SECTIONS } from "./defaultEditorGuideSections";
import type { EditorGuideSection, EditorWelcomeGuideOptions } from "./editorGuideTypes";

export function resolveEditorGuideSections(
    options?: EditorWelcomeGuideOptions,
): EditorGuideSection[] {
    if (options?.sections?.length) {
        const extra = options.extraSections ?? [];
        return extra.length > 0 ? [...options.sections, ...extra] : options.sections;
    }
    const base = DEFAULT_EDITOR_GUIDE_SECTIONS;
    const extra = options?.extraSections ?? [];
    return extra.length > 0 ? [...base, ...extra] : base;
}
