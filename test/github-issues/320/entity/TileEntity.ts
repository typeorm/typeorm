import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ActivityEntity } from "./ActivityEntity"

@Entity("tile")
export class TileEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string

    @ManyToMany((type) => TileEntity, (tile) => tile.children, {
        cascade: ["insert"],
    })
    @JoinTable()
    parents: TileEntity[]

    @ManyToMany((type) => TileEntity, (tile) => tile.parents, {
        cascade: ["insert"],
    })
    children: TileEntity[]

    @ManyToMany((type) => ActivityEntity, (activity) => activity.tiles, {
        cascade: ["insert"],
    })
    @JoinTable()
    activities: ActivityEntity[]
}
