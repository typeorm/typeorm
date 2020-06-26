import { Column } from "@typeorm/core";
import { Unit } from "./Unit";

export class Content extends Unit {

    @Column()
    name: string;

}
