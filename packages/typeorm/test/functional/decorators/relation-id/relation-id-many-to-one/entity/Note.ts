import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { RelationId } from "../../../../../../src/decorator/relations/RelationId"
import { Tag } from "./Tag"

@Entity()
export class Note {
    @PrimaryColumn()
    id: number

    @ManyToOne(() => Tag)
    tag: Tag | null

    @RelationId((note: Note) => note.tag)
    tagId: number = 0
}
