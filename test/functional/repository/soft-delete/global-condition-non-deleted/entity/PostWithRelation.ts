import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { CategoryWithRelation } from "./CategoryWithRelation"
import { DeleteDateColumn } from "typeorm/decorator/columns/DeleteDateColumn"

@Entity()
export class PostWithRelation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => CategoryWithRelation, (category) => category.post, {
        eager: true,
    })
    @JoinColumn()
    category: CategoryWithRelation

    @DeleteDateColumn()
    deletedAt: Date
}
