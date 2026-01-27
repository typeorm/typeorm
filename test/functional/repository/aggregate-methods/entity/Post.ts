import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"

// GitHub issue: #11213 - orderBy on entity should not affect aggregate methods on repository
@Entity({ orderBy: { counter: "DESC" } })
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    counter: number
}
