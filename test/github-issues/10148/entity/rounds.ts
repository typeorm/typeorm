import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../src"
import { Groups } from "./groups"

@Entity({ name: "rounds" })
export class Rounds {
    @PrimaryColumn({ name: "key", length: 70, type: "varchar" })
    key: string

    @Column({ name: "name", length: 100, type: "varchar" })
    name: string

    @ManyToOne(() => Groups, (group) => group.key)
    @JoinColumn({ name: "group_key" })
    group?: Groups

    @PrimaryColumn({ name: "group_key", length: 70, type: "varchar" })
    groupKey: string
}
