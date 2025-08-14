import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Order,
    Orderable,
} from "../../../../../src"

@Orderable()
@Entity()
export class TestMoveAfterMoved {
    @Order({})
    @PrimaryGeneratedColumn()
    id: number

    @Order({})
    @Column()
    a: string

    @Order({})
    @Column()
    b: string

    @Order({})
    @Column()
    c: string

    @Order({ after: "e" })
    @Column()
    d: string

    @Order({ before: "a" })
    @Column()
    e: string

    @Order({})
    @Column()
    f: string

    @Order({})
    @Column()
    g: string

    @Order({})
    @Column()
    h: string

    @Order({})
    @Column()
    i: string
}
