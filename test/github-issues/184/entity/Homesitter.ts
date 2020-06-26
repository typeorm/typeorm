import { ChildEntity, Column } from "@typeorm/core";
import { Person, PersonType } from "./Person";

@ChildEntity(PersonType.Homesitter) // required
export class Homesitter extends Person {

    @Column()
    numberOfKids: number;

    @Column()
    shared: string;

    constructor() {
        super();
        this.type = 2;
    }

}
