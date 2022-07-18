import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { PostCategory } from "./PostCategory"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ default: false })
    active: boolean

    @UpdateDateColumn()
    updateDate: Date

    @OneToOne((type) => PostCategory)
    @JoinColumn()
    category: PostCategory

    @Column()
    updatedColumns: number = 0

    @Column()
    updatedRelations: number = 0
}
