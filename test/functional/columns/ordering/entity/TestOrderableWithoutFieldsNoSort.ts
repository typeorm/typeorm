import {
    Column,
    Entity,
    Orderable,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Orderable()
@Entity()
export class TestOrderableWithoutFieldsNoSort {
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
