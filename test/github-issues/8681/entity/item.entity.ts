import { ManyToOne, PrimaryGeneratedColumn } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";
import { Thing } from "./thing.entity";

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Thing, thing => thing.items)
  thing!: Thing;
}
