import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Unique } from "typeorm/decorator/Unique"

@Entity()
@Unique(["name"], { deferrable: "INITIALLY DEFERRED" })
export class Company {
    @PrimaryColumn()
    id: number

    @Column()
    name?: string
}
