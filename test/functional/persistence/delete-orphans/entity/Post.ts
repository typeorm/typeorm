import { Category } from "./Category"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    categoryId: string

    @ManyToOne(() => Category, (category) => category.posts, {
        orphanedRowAction: "delete",
    })
    @JoinColumn({ name: "categoryId" })
    category: Category
}
