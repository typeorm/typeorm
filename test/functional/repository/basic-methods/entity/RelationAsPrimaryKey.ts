import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm"
import { Category } from "./Category"

@Entity()
export class RelationAsPrimaryKey {
    @OneToOne(() => Category)
    @JoinColumn()
    category: Category

    @PrimaryColumn()
    categoryId: number
}
