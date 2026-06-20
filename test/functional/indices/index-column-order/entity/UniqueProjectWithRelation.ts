import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../../src"
import { Category } from "./Category"

@Entity()
@Unique("uniq_project_relation_3336", [
    { field: "category", order: "DESC" },
    "name",
])
export class UniqueProjectWithRelation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Category)
    @JoinColumn({ name: "category_id" })
    category: Category
}
