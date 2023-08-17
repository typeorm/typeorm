import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
} from "../../../../src"

export class Embedded {
    @Column({ type: "integer", nullable: true })
    a: number | null

    @Column({ type: "varchar", nullable: true })
    b: string | null
}

@Entity()
export class Test extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column(() => Embedded)
    embedded: Embedded | null
}
