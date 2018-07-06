import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";

@Entity()
export class Student {

    @PrimaryColumn("binary")
    id: Buffer;
}