import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { MiddleEntity } from "./MiddleEntity"

@Entity()
export class FinalEntity extends MiddleEntity {
    @Column({ length: 200, nullable: false, unique: true })
    description: string

    @Column({ nullable: false })
    status: string

    @Column()
    category: string
}
