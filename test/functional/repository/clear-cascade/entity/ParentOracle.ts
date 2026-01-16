import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../../src"
import { ChildOracle } from "./ChildOracle"

@Entity()
export class ParentOracle {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => ChildOracle, (child) => child.parent)
    children: ChildOracle[]
}
