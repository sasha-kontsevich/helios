// Определяем, как выглядит префаб в памяти
import {ComponentMap} from "./index";

export type PrefabData = {
    components: {
        [K in keyof ComponentMap]: {
            // простые поля (числа, массивы) или ссылки на ассеты в GUID
            [field: string]: number | number[] | string;
        }
    }
};
