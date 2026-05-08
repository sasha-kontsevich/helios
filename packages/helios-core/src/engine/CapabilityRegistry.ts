/**
 * Maps capability keys (e.g. `renderer.three`) to values registered by plugins during setup.
 */
export class CapabilityRegistry {
    private readonly byKey = new Map<string, unknown>();

    register(key: string, value: unknown): void {
        if (this.byKey.has(key)) {
            throw new Error(`[CapabilityRegistry] Capability "${key}" is already registered.`);
        }
        this.byKey.set(key, value);
    }

    /**
     * Replace or set a capability (e.g. active camera handoff). Prefer {@link register} for first registration.
     */
    set(key: string, value: unknown): void {
        this.byKey.set(key, value);
    }

    get<T>(key: string): T {
        const value = this.byKey.get(key);
        if (value === undefined) {
            throw new Error(`[CapabilityRegistry] Capability "${key}" is not registered.`);
        }
        return value as T;
    }

    getOrUndefined<T>(key: string): T | undefined {
        return this.byKey.get(key) as T | undefined;
    }

    has(key: string): boolean {
        return this.byKey.has(key);
    }

    delete(key: string): boolean {
        return this.byKey.delete(key);
    }

    clear(): void {
        this.byKey.clear();
    }
}
