import {
    ChildEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
} from "../../../../../../src"

/**
 * Single table inheritance without any embedded column - the case that always worked.
 */
@Entity({ name: "plain_base" })
@TableInheritance({ column: { type: String, name: "discriminator" } })
export abstract class PlainBase {
    @PrimaryGeneratedColumn()
    id!: number
}

@ChildEntity()
export class PlainChild extends PlainBase {
    @Column({ type: String, nullable: true })
    value?: string
}
