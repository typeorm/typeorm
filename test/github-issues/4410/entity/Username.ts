import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Username {
    @PrimaryColumn()
    username: string

    @Column()
    email: string
}
