import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "category_id" })
    categoryId: number

    @ManyToOne(() => Category)
    @JoinColumn({ name: "category_id" })
    category: Category
}
