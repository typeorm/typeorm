import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { MiddleEntity } from "./MiddleEntity"

@Entity()
export class FinalEntity extends MiddleEntity {
    @Column({ type: String, length: 200, nullable: false, unique: true })
    description: string | null

    @Column({ type: String, nullable: false })
    status: string | null

    @Column()
    category: string
}
