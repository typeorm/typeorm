import {Entity} from "../../../../src/decorator/entity/Entity";
import { PrimaryColumn } from "../../../../src";

@Entity()
export class Dummy2 {
    @PrimaryColumn("integer", {
        generated: true,
        nullable: false,
        primary: true,
    })
    id: number;
}

