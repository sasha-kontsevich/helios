import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import type { EditorShellActiveView, EngineAPI } from "@merlinn/helios-core";
import type { PlayModeController } from "@merlinn/helios-editor";
import {
    ASTRIS_GOL_STATS_CAPABILITY,
    ASTRIS_GOL_TOOL_CAPABILITY,
    type GolStatsState,
    type GolToolMode,
    type GolToolState,
} from "../game/astrisCapabilities";

export function useAstrisGameState(props: {
    engineApi: EngineAPI;
    playMode: PlayModeController;
    getActiveView: () => EditorShellActiveView;
    subscribeActiveView: (listener: (view: EditorShellActiveView) => void) => () => void;
}): {
    visible: Ref<boolean>;
    playSessionActive: Ref<boolean>;
    simulationPaused: Ref<boolean>;
    toolMode: Ref<GolToolMode>;
    generation: Ref<number>;
    aliveCount: Ref<number>;
    statusLabel: Ref<string>;
    statusClass: Ref<string>;
} {
    const visible = ref(props.getActiveView() === "game");
    const playSessionActive = ref(props.playMode.isPlaying);
    const simulationPaused = ref(props.engineApi.isSimulationPaused());
    const toolMode = ref<GolToolMode>("paint");
    const generation = ref(0);
    const aliveCount = ref(0);

    function syncFromCapabilities(): void {
        const stats = props.engineApi.getCapability<GolStatsState>(ASTRIS_GOL_STATS_CAPABILITY);
        if (stats) {
            generation.value = stats.generation;
            aliveCount.value = stats.aliveCount;
        }
        const tool = props.engineApi.getCapability<GolToolState>(ASTRIS_GOL_TOOL_CAPABILITY);
        if (tool) {
            toolMode.value = tool.mode;
        }
        simulationPaused.value = props.engineApi.isSimulationPaused();
        playSessionActive.value = props.playMode.isPlaying;
    }

    const statusLabel = computed(() => {
        if (!playSessionActive.value) {
            return "Edit";
        }
        return simulationPaused.value ? "Paused" : "Running";
    });

    const statusClass = computed(() => {
        if (!playSessionActive.value) {
            return "astris-cockpit__chip--edit";
        }
        return simulationPaused.value ? "astris-cockpit__chip--paused" : "astris-cockpit__chip--running";
    });

    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let unsubActiveView: (() => void) | undefined;

    onMounted(() => {
        unsubActiveView = props.subscribeActiveView((view) => {
            visible.value = view === "game";
        });
        syncFromCapabilities();
        pollTimer = setInterval(syncFromCapabilities, 100);
    });

    onUnmounted(() => {
        unsubActiveView?.();
        if (pollTimer !== undefined) {
            clearInterval(pollTimer);
        }
    });

    return {
        visible,
        playSessionActive,
        simulationPaused,
        toolMode,
        generation,
        aliveCount,
        statusLabel,
        statusClass,
    };
}
