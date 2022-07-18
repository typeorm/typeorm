import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { DeleteDateColumn } from "../typeorm/decorator/columns/DeleteDateColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @DeleteDateColumn()
    deletedAt: Date
}
