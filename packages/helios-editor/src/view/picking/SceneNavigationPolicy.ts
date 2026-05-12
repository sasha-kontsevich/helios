/**
 * Pluggable rules for editor scene navigation (orbit / pan / future hand tool).
 * {@link UnityLikeSceneNavigationPolicy} matches Unity Scene view defaults: LMB selects, Alt+LMB orbits.
 */
export interface SceneNavigationPolicy {
    /** When true, OrbitControls may use the left mouse button for rotate. */
    orbitLeftMouseEnabled(altKey: boolean): boolean;
}

export class UnityLikeSceneNavigationPolicy implements SceneNavigationPolicy {
    orbitLeftMouseEnabled(altKey: boolean): boolean {
        return altKey;
    }
}
