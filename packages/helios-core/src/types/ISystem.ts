import {Context} from "../index";

export type SystemConstructor = new (context: Context) => ISystem

export interface ISystem {
    init?(context: Context): Promise<void> | void;
    update(context: Context, deltaTime: number): void;
    stop?(context: Context): void;
}
