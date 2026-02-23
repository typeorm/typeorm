import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../../src"
import { ChildOracle } from "./ChildOracle"
import { ChildNoDelete } from "./ChildNoDelete"

@Entity()
export class ParentOracle {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => ChildOracle, (child) => child.parent)
    children: ChildOracle[]

    @OneToMany(() => ChildNoDelete, (child) => child.parent)
    childrenNoDelete: ChildNoDelete[]
}
