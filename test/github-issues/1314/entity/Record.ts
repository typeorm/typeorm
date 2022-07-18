import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

/**
 * For testing Postgres jsonb
 */
@Entity()
export class Record {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "json", nullable: true })
    config: any

    @Column({ type: "jsonb", nullable: true })
    data: any
}
