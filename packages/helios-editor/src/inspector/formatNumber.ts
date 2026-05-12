/** Display-only formatting for numeric inspector fields (ECS values stay full precision). */
export function formatNumberForInput(n: number, maxDecimals = 4): string {
    if (!Number.isFinite(n)) return "";
    const rounded = Number(n.toPrecision(12));
    const s = String(rounded);
    if (!s.includes("e") && !s.includes("E")) {
        const [whole, frac] = s.split(".");
        if (frac && frac.length > maxDecimals) {
            return `${whole}.${frac.slice(0, maxDecimals)}`;
        }
    }
    return s;
}
