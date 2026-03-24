import {
    Column,
    OneToMany,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Rule } from "./Rule"

@Entity()
export class Fact {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Rule, (rule) => rule.fact)
    rules: Rule[]
}
