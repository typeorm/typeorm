import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn
} from "../../../../src"

export class Embedded {
    a: string
}

@Entity()
export class TestSQL extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column(() => Embedded, { nullable: true })
    embedded: Embedded | null
}
