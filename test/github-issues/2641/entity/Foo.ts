import {Column, PrimaryGeneratedColumn, OneToMany} from "../../../../src";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {Bar} from "./Bar";

@Entity("foo")
export class Foo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Bar, bar => bar.foo)
    public bar: Bar;
}
