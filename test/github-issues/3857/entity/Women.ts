import { Person } from "./Person";
import { ChildEntity, Column } from "@typeorm/core";

@ChildEntity()
export class Women extends Person {

    @Column("int")
    brassiereSize: number;
}
