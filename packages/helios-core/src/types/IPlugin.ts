import { Context } from '../index';

export interface IPlugin {
    /** Уникальное имя пакета (неймспейс) */
    readonly name: string;

    /** Регистрация компонентов, систем, ресурсов и прочего */
    setup(context: Context): void;

    /** Опциональная асинхронная инициализация после setup */
    init?(context: Context): Promise<void> | void;
}
