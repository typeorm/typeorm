import { Column } from "@typeorm/core";
import { Unit } from "./Unit";

export class ContentModule extends Unit {

    @Column()
    tag: string;

}
