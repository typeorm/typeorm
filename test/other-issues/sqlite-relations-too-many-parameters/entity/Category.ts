import {Column, Entity} from "../../../../src";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    constructor(id?: number, name?: string) {
        if (id) this.id = id;
        if (name) this.name = name;
    }

}