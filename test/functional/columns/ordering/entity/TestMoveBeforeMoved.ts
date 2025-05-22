import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Order,
    Orderable,
} from "../../../../../src"

@Orderable()
@Entity()
export class TestMoveBeforeMoved {
    @Order({})
    @PrimaryGeneratedColumn()
    id: number

    @Order({})
    @Column()
    a: string

    @Order({})
    @Column()
    b: string

    @Order({ before: "a" })
    @Column()
    c: string

    @Order({})
    @Column()
    d: string

    @Order({})
    @Column()
    e: string

    @Order({ before: "c" })
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
