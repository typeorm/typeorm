import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

@Entity()
export class JsonPathExample {
    @PrimaryColumn()
    id: number

    @Column({ type: "jsonpath" })
    path: string
}
