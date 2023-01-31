import { Column, Entity, ManyToOne } from "../../../../src";
import { BaseEntityAbstract } from "./BaseEntity";
import { Person } from "./Person";

@Entity()
export class Car extends BaseEntityAbstract {

    @Column()
    type: string;

  @ManyToOne(
    () => Person,
    x => x.cars,
    { onUpdate: "CASCADE", onDelete: "CASCADE" },
  )
  person: Person;
}
