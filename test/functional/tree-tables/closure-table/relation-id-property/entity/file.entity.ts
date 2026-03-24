import {
    Column,
    PrimaryGeneratedColumn,
    Tree,
    TreeParent,
    TreeChildren,
} from "../../../../../../src"
import { Entity } from "../../../../../../src/decorator/entity/Entity"

@Entity()
@Tree("closure-table")
export class File {
    @PrimaryGeneratedColumn() id: number

    @Column()
    name: string

    @Column({ nullable: true })
    parentId: number

    @TreeParent() parent: File

    @TreeChildren() children: File[]
}
