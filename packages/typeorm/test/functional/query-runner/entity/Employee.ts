import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Company } from "./Company"

@Entity()
export class Employee {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Company, { deferrable: "INITIALLY DEFERRED" })
    company: Company
}
