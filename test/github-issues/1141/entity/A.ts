import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {B} from "./B";
import {C} from "./C";

@Entity()
export class A {

    constructor() {
        this.b = new B();
        this.c = new C();
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column(type => B)
    b: B;

    @Column(type => C)
    c: C;

    @Column()
    n: number;
}