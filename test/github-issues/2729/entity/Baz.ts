import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src";
import { Foo } from "./Foo";

@Entity()
export class Baz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Foo, foo => foo.baz, { lazy: true })
  foos: Promise<Foo[]>;
} 
