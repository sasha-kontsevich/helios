declare module "obj2gltf" {
    export default function obj2gltf(
        input: string,
        options?: { binary?: boolean },
    ): Promise<ArrayBuffer | Buffer>;
}
