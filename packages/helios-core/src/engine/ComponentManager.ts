import { Component } from 'bitecs';
import { ComponentMap } from '../index';

export class ComponentManager {
    private components = new Map<keyof ComponentMap, Component>();

    constructor() { }

    /**
     * Регистрирует все переданные компоненты, отфильтрованные по ключам ComponentMap.
     *
     * @param provided — объект-экспорт: import * as Provided from '…';
     */
    public registerAll(provided: Record<string, unknown>) {
        // приводим ключи runtime -> keyof ComponentMap
        const names = Object.keys(provided) as Array<keyof ComponentMap>;

        for (const name of names) {
            // дополнительная защита: свойство должно реально быть в объекте
            if (provided[name] !== undefined) {
                // TS: компонент точно есть в ComponentMap, runtime: берём из provided
                this.register(name, provided[name] as ComponentMap[typeof name]);
            }
        }
    }

    public register<K extends keyof ComponentMap>(name: K, component: ComponentMap[K]) {
        this.components.set(name, component as unknown as Component);
    }

    public get<K extends keyof ComponentMap>(name: K): ComponentMap[K] {
        const component = this.components.get(name);
        if (!component) {
            throw new Error(`Component "${name}" not found.`);
        }
        return component as ComponentMap[K];
    }

    public has<K extends keyof ComponentMap>(name: K): boolean {
        return this.components.has(name);
    }

    public unregister<K extends keyof ComponentMap>(name: K) {
        if (!this.components.delete(name)) {
            console.warn(`[ComponentManager] Пытались удалить незарегистрированный компонент "${name}".`);
        }
    }

    public list(): string[] {
        return Array.from(this.components.keys());
    }
}
