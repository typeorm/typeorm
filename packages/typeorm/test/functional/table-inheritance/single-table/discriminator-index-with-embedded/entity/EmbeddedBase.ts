import {
    ChildEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "../../../../../../src"

import { Meta } from "./Meta"

/**
 * Single table inheritance with both an embedded column and a generated column.
 */
@Entity({ name: "embedded_base" })
@TableInheritance({ column: { type: String, name: "discriminator" } })
export abstract class EmbeddedBase {
    @PrimaryGeneratedColumn()
    id!: number

    @Column(() => Meta)
    meta!: Meta
}

@ChildEntity()
export class EmbeddedChild extends EmbeddedBase {
    @Column({ type: String, nullable: true })
    value?: string
}
