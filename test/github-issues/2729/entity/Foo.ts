import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src";
import { Bar } from "./Bar";
import { Baz } from "./Baz";

@Entity()
export class Foo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Bar, bar => bar.foos, { lazy: true })
  bar: Promise<Bar>;

  @ManyToOne(() => Baz, baz => baz.foos, { lazy: true })
  baz: Promise<Baz>;
}
