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
        cascadeInsert: true,
        cascadeUpdate: false
    })
    @JoinTable()
    parents: TileEntity[];

    @ManyToMany(type => TileEntity, tile => tile.parents, {
        cascadeInsert: true,
        cascadeUpdate: false
    })
    children: TileEntity[];

    @ManyToMany(type => ActivityEntity, activity => activity.tiles, {
        cascadeInsert: true,
        cascadeUpdate: false
    })
    @JoinTable()
    activities: ActivityEntity[];
}