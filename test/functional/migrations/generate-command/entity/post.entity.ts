import { Entity } from "typeorm/decorator/entity/Entity"
import { BaseEntity } from "typeorm/repository/BaseEntity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { JoinTable, ManyToMany } from "typeorm"
import { Category } from "./category.entity"

@Entity("post_test")
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({
        default: "This is default text.",
    })
    text: string

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[]
}
