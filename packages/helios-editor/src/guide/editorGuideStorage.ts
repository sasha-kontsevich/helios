export function isGuideDismissed(storageKey: string): boolean {
    try {
        return localStorage.getItem(storageKey) === "1";
    } catch {
        return false;
    }
}

export function setGuideDismissed(storageKey: string, dismissed: boolean): void {
    try {
        if (dismissed) {
            localStorage.setItem(storageKey, "1");
        } else {
            localStorage.removeItem(storageKey);
        }
    } catch {
        // private mode / quota — ignore
    }
}
