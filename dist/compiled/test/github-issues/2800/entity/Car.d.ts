import { Engine, Vehicle } from "./Vehicle";
export declare class CarEngine extends Engine {
    horsePower: number;
    torque: number;
}
export declare class Car extends Vehicle {
    engine: CarEngine;
}
