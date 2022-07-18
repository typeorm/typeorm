import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Index } from "typeorm/decorator/Index"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

import { Master } from "./master"

@Entity()
@Index("IDX_UNQ_MasterId", (type) => [type.masterId], { unique: true })
export class Detail {
    @PrimaryColumn({
        length: 20,
    })
    id: string

    @Column({
        nullable: false,
        length: 20,
    })
    masterId: string

    @ManyToOne((type) => Master, (master) => master.details, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "masterId",
    })
    master: Master
}
