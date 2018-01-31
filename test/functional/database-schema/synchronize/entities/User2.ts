import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";

@Entity()
export class User2 {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;
}