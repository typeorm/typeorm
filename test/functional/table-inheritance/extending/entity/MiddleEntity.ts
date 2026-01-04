import { Column } from "../../../../../src/decorator/columns/Column"
import { BaseEntity } from "./BaseEntity"

export abstract class MiddleEntity extends BaseEntity {
    @Column({ length: 100, nullable: false })
    description: string

    @Column({ nullable: true })
    status: string
}
