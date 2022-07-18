import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Unique } from "typeorm/decorator/Unique"
import { Company } from "./Company"

@Entity()
@Unique(["name"], { deferrable: "INITIALLY IMMEDIATE" })
export class Office {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Company, (company) => company.id, {
        deferrable: "INITIALLY IMMEDIATE",
    })
    company: Company
}
