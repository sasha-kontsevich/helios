import {ComponentMap} from "./index";

export  type ComponentOverrides = {
    [K in keyof ComponentMap]?: Partial<{
        [P in keyof ComponentMap[K]]: ComponentMap[K][P] | string;
    }>;
};
