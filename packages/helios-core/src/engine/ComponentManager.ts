import {Component} from "bitecs";
import { ComponentMap } from '../index';

export class ComponentManager {
    private components = new Map<keyof ComponentMap, Component>();

    constructor() {
        this.components = new Map();
    }

    register<K extends keyof ComponentMap>(name: K, component: ComponentMap[K]) {
        this.components.set(name, component);
    }

    get<K extends keyof ComponentMap>(name: K): ComponentMap[K] {
        const component = this.components.get(name);
        if (!component) {
            throw new Error(`Component "${name}" not found.`);
        }
        return component as ComponentMap[K];
    }

    has<K extends keyof ComponentMap>(name: K): boolean {
        return this.components.has(name);
    }

    unregister<K extends keyof ComponentMap>(name: K) {
        if (!this.components.delete(name)) {
            console.warn(`[ComponentManager] Пытались удалить незарегистрированный компонент "${name}".`);
        }
    }

    list(): string[] {
        return Array.from(this.components.keys());
    }
}
