import {
    ChildEntity,
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "../../../../../../src"

import { Meta } from "./Meta"

/**
 * Same as EmbeddedBase, but the discriminator column is indexed explicitly by the user.
 */
@Entity({ name: "indexed_base" })
@TableInheritance({ column: { type: String, name: "discriminator" } })
export abstract class IndexedBase {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: String })
    @Index("IX_indexed_base_discriminator")
    discriminator!: string

    @Column(() => Meta)
    meta!: Meta
}

@ChildEntity()
export class IndexedChild extends IndexedBase {
    @Column({ type: String, nullable: true })
    value?: string
}
