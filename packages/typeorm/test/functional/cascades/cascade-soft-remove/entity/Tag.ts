import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn"
import { BaseEntity } from "../../../../../src/repository/BaseEntity"

@Entity()
export class Tag extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @DeleteDateColumn()
    deletedAt: Date
}
