import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Role } from "./Role"

@Entity()
export class User {
    @PrimaryColumn() id: number

    @PrimaryColumn() name: string

    @Column() handedness: string

    @ManyToMany((type) => Role, {
        cascade: ["insert"],
    })
    @JoinTable()
    roles: Role[]
}
