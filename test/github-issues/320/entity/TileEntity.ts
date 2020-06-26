import { Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { ActivityEntity } from "./ActivityEntity";

@Entity("tile")
export class TileEntity {
    @PrimaryGeneratedColumn({type: "bigint"})
    id: string;

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
