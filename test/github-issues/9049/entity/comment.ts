import { Value } from "./value"
import { Column } from "../../../../src"

export class Comment {
    @Column(() => Value, { array: true })
    values: Value[]
}
