import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "../../../../src";
import { Foo } from "./Foo";

@Entity()
export class Bar {

  // Post ID also acts as PK for FeaturePost (ie. inheritance)
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @OneToOne(() => Foo, { cascade: true })
  @JoinColumn({ name: "id" })
  foo: Foo;
}
