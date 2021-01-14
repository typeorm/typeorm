import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity()
export class ActionDetails {

    @PrimaryColumn()
    id: number;

    @Column()
    description: string;

}
