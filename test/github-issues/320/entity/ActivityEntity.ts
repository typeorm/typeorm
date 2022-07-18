import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { TileEntity } from "./TileEntity"

@Entity("activity")
export class ActivityEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string

    @Column({ type: "datetime" })
    endDate: Date

    @ManyToMany((type) => TileEntity, (tile) => tile.activities, {
        cascade: true,
    })
    tiles: TileEntity[]
}
