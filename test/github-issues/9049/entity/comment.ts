import { Value } from "./value"
import { Column } from "typeorm"

export class Comment {
    @Column(() => Value, { array: true })
    values: Value[]
}
