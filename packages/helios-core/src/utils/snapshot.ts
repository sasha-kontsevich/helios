/**
 * Bitecs / Helios store component fields in TypedArrays; `Array.isArray` is false for them.
 */
function isIndexedComponentStorage(v: unknown): v is ArrayLike<number> {
    return Array.isArray(v) || (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(v as ArrayBufferView));
}

export function extractComponentData(component: any, eid: number): Record<string, any> {
    const data: Record<string, any> = {};
    for (const key of Object.keys(component)) {
        if (key === "get") continue;
        const storage = component[key];
        if (typeof storage === "function") continue;
        if (isIndexedComponentStorage(storage)) {
            data[key] = storage[eid];
        }
    }
    return data;
}
