import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {ManyToMany} from "../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../src/decorator/relations/JoinTable";
import {ActivityEntity} from "./ActivityEntity";

@Entity("tile")
export class TileEntity {
    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @ManyToMany(type => TileEntity, tile => tile.children, {
        cascade: ["insert"]
    })
    @JoinTable()
    parents: TileEntity[];

    @ManyToMany(type => TileEntity, tile => tile.parents, {
        cascade: ["insert"]
    })
    children: TileEntity[];

    @ManyToMany(type => ActivityEntity, activity => activity.tiles, {
        cascade: ["insert"]
    })
    @JoinTable()
    activities: ActivityEntity[];
}