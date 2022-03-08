import { OneToMany, PrimaryGeneratedColumn } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";
import { Item } from "./item.entity";

@Entity()
export class Thing {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Item, item => item.thing)
  items!: Item[];
}
