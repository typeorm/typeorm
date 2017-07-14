import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";
import {Index} from "../../../../../../../src/decorator/Index";

@Entity()
@Index(["id", "name"])
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

}