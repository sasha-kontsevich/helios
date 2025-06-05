export function extractComponentData(component: any, eid: number): Record<string, any> {
    const data: Record<string, any> = {};
    for (const key of Object.keys(component)) {
        if (Array.isArray(component[key])) {
            data[key] = component[key][eid];
        }
    }
    return data;
}
