import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"

@Entity()
export class Tag {
    @PrimaryColumn({ primaryKeyConstraintName: "PK_TAG" })
    name: string

    @PrimaryColumn({ primaryKeyConstraintName: "PK_TAG" })
    group: string
}
