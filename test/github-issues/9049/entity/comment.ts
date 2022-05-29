import { Type } from "class-transformer"
import { Value } from "./value"
import { Column } from "../../../../src"

export class Comment {
    @Type(() => Value)
    @Column(() => Value, { array: true })
    values: Value[]
}
