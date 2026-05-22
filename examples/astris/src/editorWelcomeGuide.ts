import type { EditorGuideSection } from "@merlinn/helios-editor";

export const ASTRIS_EDITOR_GUIDE_SECTIONS: EditorGuideSection[] = [
    {
        id: "astris-gol",
        title: "Astris — Game of Life",
        bullets: [
            "Вкладка «Игра» — поле Conway: ЛКМ по ячейке переключает клетку, drag — рисование/стирание.",
            "HUD внизу: Play/Stop, Pause, Paint/Erase, Clear и пресеты паттернов (пушки, пульсар и др.).",
            "Наведение без кнопок показывает превью клетки; живые клетки рисуются instanced mesh.",
        ],
    },
    {
        id: "astris-camera",
        title: "Astris — камера в Play",
        bullets: [
            "В Play включается fly-камера (WASD, мышь) на сущности с AstrisFlyCamera.",
            "Корабль и симуляция движения работают только в Play; в редакторе сцена статична.",
        ],
    },
];
