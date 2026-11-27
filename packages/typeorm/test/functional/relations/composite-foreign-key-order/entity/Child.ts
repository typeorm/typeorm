import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from "../../../../../src"
import { Parent } from "./Parent"

@Entity()
export class Child {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Parent)
    @JoinColumn([
        { name: "parentSecondId", referencedColumnName: "secondId" },
        { name: "parentFirstId", referencedColumnName: "firstId" },
    ])
    parent: Parent
}
