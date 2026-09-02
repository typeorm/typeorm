import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { CreateDateColumn } from "../../../../../src/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "../../../../../src/decorator/columns/UpdateDateColumn"
import { PostIncrement } from "./PostIncrement"

@Entity()
export class PostContent {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    body: string

    @ManyToOne(() => PostIncrement, { nullable: true })
    relatedPost: PostIncrement | null

    @CreateDateColumn()
    createDate: Date

    @UpdateDateColumn()
    updateDate: Date
}
