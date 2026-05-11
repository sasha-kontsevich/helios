export type SelectionEid = number | null;

export type SelectionSubscriber = (eid: SelectionEid) => void;

/**
 * Minimal pub/sub for the primary selected entity id (editor shell, scene overlay, future picking/gizmo).
 */
export interface ISelectionBus {
    get(): SelectionEid;
    set(eid: SelectionEid): void;
    subscribe(fn: SelectionSubscriber): () => void;
}

export class SelectionBus implements ISelectionBus {
    private current: SelectionEid = null;
    private readonly listeners = new Set<SelectionSubscriber>();

    get(): SelectionEid {
        return this.current;
    }

    set(eid: SelectionEid): void {
        if (this.current === eid) {
            return;
        }
        this.current = eid;
        for (const fn of [...this.listeners]) {
            fn(eid);
        }
    }

    subscribe(fn: SelectionSubscriber): () => void {
        this.listeners.add(fn);
        fn(this.current);
        return () => {
            this.listeners.delete(fn);
        };
    }
}

/** For {@link Editor} constructed without an explicit bus (no scene overlay / shell sync). */
export const noopSelectionBus: ISelectionBus = {
    get: () => null,
    set: () => {},
    subscribe: () => () => {},
};
