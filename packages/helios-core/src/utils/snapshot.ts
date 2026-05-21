/**
 * Bitecs / Helios store component fields in TypedArrays; `Array.isArray` is false for them.
 */
function isIndexedComponentStorage(v: unknown): v is ArrayLike<number> {
    return Array.isArray(v) || (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(v as ArrayBufferView));
}

function isLiveThreeResource(v: unknown): boolean {
    if (typeof v !== "object" || v === null) {
        return false;
    }
    const o = v as { isBufferGeometry?: boolean; isMaterial?: boolean; type?: string };
    return (
        o.isBufferGeometry === true ||
        o.isMaterial === true ||
        o.type === "BufferGeometry" ||
        (typeof o.type === "string" && /Material$/.test(o.type))
    );
}

export function extractComponentData(component: any, eid: number): Record<string, any> {
    const data: Record<string, any> = {};
    const hasProxyGet = typeof component?.get === "function";
    for (const key of Object.keys(component)) {
        if (key === "get") continue;
        const storage = component[key];
        if (typeof storage === "function") continue;
        if (isIndexedComponentStorage(storage)) {
            const raw = storage[eid];
            if (hasProxyGet) {
                try {
                    const resolved = component.get(eid)?.[key];
                    if (typeof resolved === "string") {
                        data[key] = resolved;
                        continue;
                    }
                    if (isLiveThreeResource(resolved)) {
                        continue;
                    }
                    if (typeof resolved === "number" && Number.isFinite(resolved)) {
                        data[key] = resolved;
                        continue;
                    }
                    if (resolved !== undefined && resolved !== null && typeof resolved === "object") {
                        data[key] = resolved;
                        continue;
                    }
                } catch {
                    // ignore proxy issues, fall back to raw
                }
            }
            data[key] = raw;
        }
    }
    return data;
}
