import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { BaseEntity } from "../typeorm"

@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Category, (category) => category.posts, {
        cascade: ["insert"],
    })
    category: Promise<Category>
}
