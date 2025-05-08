import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Order,
    Orderable,
} from "../../../../../src"
import { TimestampedEntity } from "./TimestampedEntity"

@Orderable()
@Entity()
export class TestInheritedInterleave extends TimestampedEntity {
    @Order({ priority: 50 })
    @PrimaryGeneratedColumn()
    id: number

    @Order({ priority: 50 })
    @Column()
    a: string

    @Order({ priority: 50 })
    @Column()
    b: string

    @Order({ priority: 50 })
    @Column()
    c: string

    @Order({ priority: 100 })
    @Column()
    d: string

    @Order({ priority: 101 })
    @Column()
    e: string

    @Order({ priority: 103 })
    @Column()
    f: string

    @Order({ priority: 200 })
    @Column()
    g: string

    @Order({ priority: 200 })
    @Column()
    h: string

    @Order({ priority: 200 })
    @Column()
    i: string
}
