import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { MiddleEntity } from "./MiddleEntity"

@Entity()
export class FinalEntity extends MiddleEntity {
    @Column({ length: 250 })
    description: string

    @Column()
    status: string

    @Column()
    category: string
}
