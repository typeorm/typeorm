import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src";
import { Foo } from "./Foo";

@Entity()
export class Bar {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Foo, foo => foo.bar, { lazy: true })
  foos: Promise<Foo[]>;
}
