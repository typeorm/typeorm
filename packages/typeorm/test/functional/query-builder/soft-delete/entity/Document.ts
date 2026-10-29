import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn"
import { VersionColumn } from "../../../../../src/decorator/columns/VersionColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

@Entity()
export class Document {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
