import { Entity, JoinColumn, OneToOne } from "../../../../../src";
import { Category } from "./Category";

@Entity()
export class RelationAsPrimaryKey {
    @OneToOne(() => Category, { primary: true })
    @JoinColumn()
    category: Category;
}