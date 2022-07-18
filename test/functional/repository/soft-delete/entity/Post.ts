import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { DeleteDateColumn } from "typeorm/decorator/columns/DeleteDateColumn"
import { BaseEntity } from "typeorm"

@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @DeleteDateColumn()
    deletedAt: Date

    @Column()
    name: string
}
