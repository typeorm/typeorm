import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity("post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    // json exists on mysql and postgres but the binary jsonb flavor is
    // postgres-only
    @Column({ type: "json", dialectTypes: { postgres: "jsonb" } })
    payload: object

    // tinyint exists on mysql and sqlite but not on postgres
    @Column({ type: "tinyint", dialectTypes: { postgres: "smallint" } })
    level: number
}
