import { Parent } from '../components'; // путь подправь под свой
import { IWorld } from 'bitecs';

/**
 * Проверяет, вызовет ли добавление `child` в `target` зацикливание иерархии.
 */
export function isCyclic(world: IWorld, child: number, target: number): boolean {
    let current = target;

    // Если родитель — сам объект
    if (current === child) return true;

    while (Parent.target[current]) {
        current = Parent.target[current];
        if (current === child) {
            return true;
        }
    }

    return false;
}
