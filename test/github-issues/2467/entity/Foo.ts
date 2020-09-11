import { Entity, OneToMany, PrimaryColumn } from "../../../../src";
import { Bar } from "./Bar";
import { Baz } from "./Baz";

@Entity()
export class Foo {
    @PrimaryColumn()
    fooId: number;

    @OneToMany(type => Bar, bar => bar.foo, {
        cascade: ["insert", "remove"],
        eager: true
    })
    bars: Bar[];

    @OneToMany(type => Baz, baz => baz.foo, {
        cascade: ["insert", "remove"],
        eager: true
    })
    bazs: Baz[];
}