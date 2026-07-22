import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Category } from "./Category"

@Index("IDX_12671_custom_covering", ["indexedCategoryId", "note"])
@Entity("circle_reports")
export class CircleReport {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    categoryId: number

    @ManyToOne(() => Category, { onDelete: "CASCADE" })
    @JoinColumn({ name: "categoryId" })
    category: Category

    @Column()
    indexedCategoryId: number

    @Column({ length: 32 })
    note: string

    @ManyToOne(() => Category, { onDelete: "CASCADE" })
    @JoinColumn({ name: "indexedCategoryId" })
    indexedCategory: Category
}
