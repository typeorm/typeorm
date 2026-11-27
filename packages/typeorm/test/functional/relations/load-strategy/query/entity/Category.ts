import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"

@Entity()
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => Category)
    parent?: Category | null
}
