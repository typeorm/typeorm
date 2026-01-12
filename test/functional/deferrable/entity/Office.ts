import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { ManyToOne } from "../../../../src/decorator/relations/ManyToOne"
import { Unique } from "../../../../src/decorator/Unique"

import { Company } from "./Company"

@Entity()
@Unique(["name"], { deferrable: "INITIALLY IMMEDIATE" })
export class Office {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Company, { deferrable: "INITIALLY IMMEDIATE" })
    company: Company
}
