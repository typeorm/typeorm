import { OneToMany, PrimaryGeneratedColumn } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";
import { Bar } from "./Bar";

@Entity("foo")
export class Foo {
  @PrimaryGeneratedColumn() id: number;

  @OneToMany(() => Bar, bar => bar.foo, { cascade: true, eager: true })
  bars?: Bar[];
}
