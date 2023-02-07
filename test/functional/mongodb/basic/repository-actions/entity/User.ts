import { Column } from "../../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../../src/decorator/entity/Entity"

@Entity()
export class User {
    @Column()
    name: string
}
