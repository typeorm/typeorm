import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { TileEntity } from "./TileEntity";

@Entity("activity")
export class ActivityEntity {
    @PrimaryGeneratedColumn({type: "bigint"})
    id: string;

    @Column({type: "datetime"})
    endDate: Date;

    @ManyToMany(type => TileEntity, tile => tile.activities, {
        cascade: true
    })
    tiles: TileEntity[];

}
