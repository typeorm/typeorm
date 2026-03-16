import { Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Category)
    parent?: Category | null
}
