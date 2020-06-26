import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Bar } from "./Bar";

@Entity("foo")
export class Foo {
    @PrimaryGeneratedColumn() id: number;

    @Column({default: "foo description"}) description: string;

    @OneToMany(() => Bar, bar => bar.foo, {cascade: true, eager: true})
    bars?: Bar[];
}
