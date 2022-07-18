import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
export class PostMultiplePrimaryKeys {
    @PrimaryColumn()
    firstId: number

    @PrimaryColumn()
    secondId: number

    @Column({ default: "Hello Multi Ids" })
    text: string
}
