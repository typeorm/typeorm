import { Engine, Vehicle } from "./Vehicle";
export declare class PlaneEngine extends Engine {
    beep: number;
    boop: number;
}
export declare class Plane extends Vehicle {
    engine: PlaneEngine;
}
