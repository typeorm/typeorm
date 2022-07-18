import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Company } from "./Company"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Company, (company) => company.id, {
        deferrable: "INITIALLY DEFERRED",
    })
    company: Company
}
