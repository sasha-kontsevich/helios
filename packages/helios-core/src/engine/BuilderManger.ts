import type { Context } from './Context';

export type EngineBuilder = {
    id: string;
    build(ctx: Context): void | Promise<void>;
};

export class BuilderManger {
    private builders: EngineBuilder[] = [];

    registerAll(builders: EngineBuilder[]) {
        this.builders = builders.slice();
    }

    async runAll(ctx: Context): Promise<void> {
        for (const b of this.builders) {
            await b.build(ctx);
        }
    }
}
