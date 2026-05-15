/**
 * Minimal contract for host-registered game simulation UI (pause, etc.).
 * Registered on the engine context under a string key (see {@link EngineAPI.getCapability}).
 */
export interface GameSimulationControls {
    readonly paused: boolean;
    togglePause(): void;
}
