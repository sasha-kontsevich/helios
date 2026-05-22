import { addComponent, defineQuery, hasComponent } from "bitecs";
import {
    AmbientLight,
    Camera,
    DirectionalLight,
    Geometry,
    Material,
    Mesh,
    Parent,
    Position,
    Rotation,
    Scale,
    System,
} from "@merlinn/helios-core";
import { ThreeMesh, ThreeObject } from "../components";

/**
 * Adds runtime {@link ThreeObject} / {@link ThreeMesh} for core render markers.
 * Not written to scene snapshots or spawn JSON.
 */
export class EnsureThreeRenderableSystem extends System {
    static override readonly systemName = "EnsureThreeRenderableSystem";
    static override readonly systemDescription =
        "Добавляет ThreeObject и компоненты, нужные для рендера сущности.";
    static override readonly runsInEditor = true;

    private readonly meshQuery = defineQuery([Mesh, Geometry, Material]);
    private readonly cameraQuery = defineQuery([Camera]);
    private readonly ambientQuery = defineQuery([AmbientLight]);
    private readonly directionalQuery = defineQuery([DirectionalLight]);
    private readonly transformQuery = defineQuery([Position]);
    private readonly parentQuery = defineQuery([Parent]);
    private readonly rotationQuery = defineQuery([Rotation]);
    private readonly scaleQuery = defineQuery([Scale]);

    update(): void {
        const world = this.world;

        const ensureObject = (eid: number) => {
            if (!hasComponent(world, ThreeObject, eid)) {
                addComponent(world, ThreeObject, eid);
            }
        };

        for (const eid of this.meshQuery(world)) {
            ensureObject(eid);
            if (!hasComponent(world, ThreeMesh, eid)) {
                addComponent(world, ThreeMesh, eid);
            }
        }

        for (const eid of this.cameraQuery(world)) {
            ensureObject(eid);
        }

        for (const eid of this.ambientQuery(world)) {
            ensureObject(eid);
        }

        for (const eid of this.directionalQuery(world)) {
            ensureObject(eid);
        }

        for (const eid of this.transformQuery(world)) {
            ensureObject(eid);
        }
        for (const eid of this.parentQuery(world)) {
            ensureObject(eid);
        }
        for (const eid of this.rotationQuery(world)) {
            ensureObject(eid);
        }
        for (const eid of this.scaleQuery(world)) {
            ensureObject(eid);
        }
    }
}
