export  interface EntitySnapshot {
    eid: number;
    components: Record<string, Record<string, any>>;
}