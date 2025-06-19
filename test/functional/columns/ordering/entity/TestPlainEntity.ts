import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class TestPlainEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    a: string

    @Column()
    b: string

    @Column()
    c: string

    @Column()
    d: string

    @Column()
    e: string

    @Column()
    f: string

    @Column()
    g: string

    @Column()
    h: string

    @Column()
    i: string
}
