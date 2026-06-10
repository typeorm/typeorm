import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: String, length: 50, nullable: true })
    description: string | null
}
