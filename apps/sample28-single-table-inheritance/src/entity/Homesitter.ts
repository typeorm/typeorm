import { ChildEntity, Column } from "@typeorm/core";
import { Person } from "./Person";

@ChildEntity("home-sitter")
export class Homesitter extends Person {

    @Column()
    numberOfKids: number;

}
