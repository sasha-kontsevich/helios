import {Context} from "../index";

export interface ISystem {
    init?(context: Context): Promise<void> | void;
    update(context: Context, deltaTime: number): void;
    stop?(context: Context): void;
}
