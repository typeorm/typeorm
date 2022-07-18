import { Column } from "../typeorm/decorator/columns/Column"
import { Entity } from "../typeorm/decorator/entity/Entity"

@Entity()
export class User {
    @Column()
    name: string
}
