import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

import { Detail } from "./detail"

@Entity()
export class Master {
    @PrimaryColumn({
        length: 20,
    })
    id: string

    @Column({
        nullable: false,
        length: 150,
    })
    description: string

    @OneToMany((type) => Detail, (detail) => detail.master)
    details: Detail[]
}
