import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { DeleteDateColumn } from "../../../../../../../src"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    categoryId: string

    @ManyToOne(() => Category, (category) => category.posts)
    @JoinColumn({ name: "categoryId" })
    category: Category

    @DeleteDateColumn()
    deletedAt?: Date
}
