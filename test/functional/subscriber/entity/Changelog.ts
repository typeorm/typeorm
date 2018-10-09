import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Column } from "../../../../src";

export type ChangeType = 
        "AfterInsert"
    |   "AfterUpdate"
    |   "BeforeRemove"
    |   "AfterRemove"
;


@Entity()
export class Changelog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    entityType: string;

    @Column()
    entityId: number;

    @Column()
    changeType: ChangeType;
}
