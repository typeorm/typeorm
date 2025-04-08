import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"

@Entity({
    name: "category",
})
export class Category {
    @Column({ primary: true })
    id: number

    @Column({ nullable: true })
    name: string
}
