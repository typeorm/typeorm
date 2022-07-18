import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../typeorm/decorator/columns/Column"
import { OneToOne } from "../../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../../typeorm/decorator/relations/JoinColumn"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => Category)
    @JoinColumn()
    category: Category

    @OneToOne((type) => Category, (category) => category.post)
    @JoinColumn()
    category2: Category

    categoryId: number
}
