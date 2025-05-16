import { Column, JoinColumn, ManyToOne } from "../../../../src"
import { Groups } from "./groups"
import { Rounds } from "./rounds"

export abstract class Basics {
    @ManyToOne(() => Groups)
    @JoinColumn({ name: "group_key" })
    group?: Groups

    @Column({ name: "group_key", length: 70, type: "varchar", nullable: true })
    groupKey: string

    @ManyToOne(() => Rounds)
    @JoinColumn([
        { name: "round_key", referencedColumnName: "key" },
        { name: "group_key", referencedColumnName: "groupKey" },
    ])
    round?: Rounds

    @Column({ name: "round_key", length: 70, type: "varchar", nullable: true })
    roundKey: string
}
