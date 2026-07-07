import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Category } from "./Category"

@Entity()
@Index("idx_project_relation_3336", [
    { field: "category", order: "DESC" },
    "name",
])
export class ProjectWithRelation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Category)
    @JoinColumn({ name: "category_id" })
    category: Category
}
