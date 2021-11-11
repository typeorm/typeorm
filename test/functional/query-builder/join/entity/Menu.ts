import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";

@Entity()
export class Menu {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column({ default: 0 })
    parentId?: number;

    @Column()
    index: number;

    @Column()
    createdTime: Date;

}