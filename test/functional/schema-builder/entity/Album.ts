import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Album {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: "50" })
    title: string

    @Column({ type: "varchar", length: "200" })
    description: string
}
