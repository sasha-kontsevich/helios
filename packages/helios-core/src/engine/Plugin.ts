import { Context } from './Context';

export class Plugin {
    public name: string = 'plugin';
    private context!: Context;

    protected constructor() {

    }

    public setup(context: Context) {
        this.context = context;
    }

    public init() {

    }
} 