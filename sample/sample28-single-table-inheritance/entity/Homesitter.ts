import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {ChildEntity} from "../../../src/decorator/entity/ChildEntity";

@ChildEntity("home-sitter")
export class Homesitter extends Person {

    @Column()
    numberOfKids: number;

}