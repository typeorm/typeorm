import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { UpdateDateColumn } from "../../../../../src/decorator/columns/UpdateDateColumn"

@Entity()
export class PostWithOnUpdate {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @UpdateDateColumn()
    updatedAt: Date
}
