import type { AssetRecord } from "../types/AssetRecord";

export interface AssetLoadStatusSnapshot {
    readonly active: boolean;
    readonly pendingCount: number;
    readonly message: string;
}

const IDLE: AssetLoadStatusSnapshot = {
    active: false,
    pendingCount: 0,
    message: "",
};

/** Short display label for status bar (filename or guid tail). */
export function labelFromAssetRecord(record: AssetRecord): string {
    if (record.path) {
        const parts = record.path.split("/");
        const last = parts[parts.length - 1];
        if (last.length > 0) {
            return last;
        }
    }
    const tail = record.guid.split("/").pop();
    return tail && tail.length > 0 ? tail : record.guid;
}

export class AssetLoadStatusStore {
    private readonly phases = new Map<string, string>();
    private loadDepth = 0;
    private readonly loadLabels: string[] = [];
    private readonly listeners = new Set<() => void>();

    getSnapshot(): AssetLoadStatusSnapshot {
        const phaseMessages = [...this.phases.values()];
        const loadCount = this.loadDepth;
        const pendingCount = phaseMessages.length + loadCount;

        if (pendingCount === 0) {
            return IDLE;
        }

        let message = "";
        if (phaseMessages.length > 0) {
            message = phaseMessages[phaseMessages.length - 1]!;
        } else if (this.loadLabels.length > 0) {
            message = this.loadLabels[this.loadLabels.length - 1]!;
        }

        if (loadCount > 1 && phaseMessages.length === 0) {
            message = `Loading (${loadCount})…`;
        } else if (loadCount > 0 && phaseMessages.length > 0 && loadCount === 1 && this.loadLabels.length > 0) {
            const assetLabel = this.loadLabels[this.loadLabels.length - 1]!;
            message = `${message} — ${assetLabel}`;
        }

        return {
            active: true,
            pendingCount,
            message,
        };
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    beginPhase(id: string, message: string): void {
        this.phases.set(id, message);
        this.notify();
    }

    endPhase(id: string): void {
        this.phases.delete(id);
        this.notify();
    }

    pushLoad(label: string): void {
        this.loadDepth++;
        this.loadLabels.push(label);
        this.notify();
    }

    popLoad(label: string): void {
        this.loadDepth = Math.max(0, this.loadDepth - 1);
        const idx = this.loadLabels.lastIndexOf(label);
        if (idx >= 0) {
            this.loadLabels.splice(idx, 1);
        }
        this.notify();
    }

    private notify(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }
}
