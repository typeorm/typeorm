import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../src/decorator/relations/ManyToMany";
import {TileEntity} from "./TileEntity";

@Entity("activity")
export class ActivityEntity {
    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Column({type: "datetime"})
    endDate: Date;

    @ManyToMany(type => TileEntity, tile => tile.activities, {
        cascade: true
    })
    tiles: TileEntity[];

}