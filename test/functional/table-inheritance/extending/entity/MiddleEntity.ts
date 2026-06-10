import { Column } from "../../../../../src/decorator/columns/Column"
import { BaseEntity } from "./BaseEntity"

export abstract class MiddleEntity extends BaseEntity {
    @Column({ type: String, length: 100, nullable: false })
    description: string | null

    @Column({ type: String, nullable: true })
    status: string | null
}
