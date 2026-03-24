import {
    Column,
    OneToMany,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Rule } from "./Rule"

@Entity("fact")
export class Fact {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    name: string

    @OneToMany(() => Rule, (rule) => rule.fact)
    rules: Rule[]
}
