import {Vehicle} from "./Vehicle";
import {ChildEntity, Column} from "../../../../src";

export class Motor {

    @Column()
    public horsepower: number;

    @Column()
    public torque: number;

}

@ChildEntity()
export abstract class Car extends Vehicle {

    @Column(type => Motor)
    public motor: Motor;

    @Column()
    public brand: string;

}