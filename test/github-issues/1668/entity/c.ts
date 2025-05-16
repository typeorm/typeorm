import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../src"
import { A } from "./a"
import { B } from "./b"

@Entity()
export class C {
    @PrimaryColumn()
    id: number

    @Column()
    barId: number

    @Column()
    fooCode: string

    @ManyToOne(() => A)
    @JoinColumn({ name: "barId", referencedColumnName: "id" })
    a: A

    @ManyToOne(() => B)
    @JoinColumn([
        { name: "fooCode", referencedColumnName: "fooCode" },
        { name: "barId", referencedColumnName: "barId" },
    ])
    b: B
}
