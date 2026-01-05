import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Point {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { nullable: true })
    name: string

    @Column("vector", { length: 3, nullable: true })
    coords: number[]
}
