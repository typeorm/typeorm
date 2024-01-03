import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
} from "../../../../src"

export class NestedEmbedded {
    @Column({ type: "varchar", nullable: true })
    c: string | null
}

export class Embedded {
    @Column({ type: "varchar", nullable: true })
    a: string | null

    @Column({ type: "varchar", nullable: true })
    b: string | null

    @Column(() => NestedEmbedded)
    nested: NestedEmbedded | null
}

@Entity()
export class Test extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column(() => Embedded)
    embedded: Embedded | null
}
