import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { ManyToMany } from "../../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../../src/decorator/relations/JoinTable"
import { Tag } from "./Tag"

@Entity()
export class Article {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @ManyToMany(() => Tag, {
        deferrable: "INITIALLY DEFERRED",
    })
    @JoinTable()
    tags: Tag[]
}
