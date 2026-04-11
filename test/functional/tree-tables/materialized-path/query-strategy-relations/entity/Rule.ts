import {
    Column,
    ManyToOne,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Node } from "./Node"
import { Fact } from "./Fact"

@Entity()
export class Rule {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Fact, (fact) => fact.rules, { eager: true })
    fact: Fact

    @ManyToOne(() => Node, (node) => node.rules)
    node: Node
}
