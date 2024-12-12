import {
    ManyToOne,
    Entity,
    PrimaryColumn,
    BaseEntity,
    Column,
} from "../../../../src"
import Company from "./Company"

@Entity({ name: "employees" })
export default class Employee extends BaseEntity {
    @PrimaryColumn("varchar", { length: 50 })
    name: string

    @ManyToOne((type) => Company, (company) => company.employees)
    company: Company

    @Column()
    age: number
}
