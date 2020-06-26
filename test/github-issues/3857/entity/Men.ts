import { Person } from "./Person";
import { ChildEntity, Column } from "@typeorm/core";

@ChildEntity()
export class Men extends Person {

    @Column("varchar")
    beardColor: string;
}
