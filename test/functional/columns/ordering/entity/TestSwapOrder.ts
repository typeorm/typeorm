import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Order,
    Orderable,
} from "../../../../../src"

@Orderable()
@Entity()
export class TestSwapOrder {
    @Order({ priority: 2 })
    @PrimaryGeneratedColumn()
    id: number

    @Order({ priority: 1 })
    @Column()
    a: string

    @Order({ priority: 4 })
    @Column()
    b: string

    @Order({ priority: 3 })
    @Column()
    c: string

    @Order({ priority: 6 })
    @Column()
    d: string

    @Order({ priority: 5 })
    @Column()
    e: string

    @Order({ priority: 8 })
    @Column()
    f: string

    @Order({ priority: 7 })
    @Column()
    g: string

    @Order({ priority: 10 })
    @Column()
    h: string

    @Order({ priority: 9 })
    @Column()
    i: string
}
