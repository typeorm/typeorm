import { Column, PrimaryGeneratedColumn, OneToMany } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";
import { Bar } from "./Bar";

@Entity("bar")
export class Foo {
  @PrimaryGeneratedColumn() id: number;

  @Column() description: string;

  @OneToMany(type => Bar, bar => bar.foo)
  bars: Promise<Bar[]>;
}
