let motionTime = 0;

export function advanceShipMotionTime(deltaTime: number): void {
    motionTime += deltaTime;
}

export function getShipMotionTime(): number {
    return motionTime;
}

export function resetShipMotionTime(): void {
    motionTime = 0;
}
