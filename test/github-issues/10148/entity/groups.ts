import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../src"
import { Rounds } from "./rounds"

@Entity({ name: "groups" })
export class Groups {
    @PrimaryColumn({ name: "key", length: 70, type: "varchar" })
    key: string

    @Column({ name: "name", length: 70, type: "varchar" })
    name: string

    @Column({ name: "type", length: 20, type: "varchar" })
    type: string

    @OneToMany(() => Rounds, (round) => round.group)
    rounds: Rounds[]
}
