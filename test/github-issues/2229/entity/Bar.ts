import { Column, PrimaryGeneratedColumn, ManyToOne } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";
import { Foo } from "../entity/Foo";

@Entity("bar")
export class Bar {
  @PrimaryGeneratedColumn() id: number;

  @Column() description: string;

  @ManyToOne(type => Foo, foo => foo.bars)
  foo: Promise<Foo>;
}
