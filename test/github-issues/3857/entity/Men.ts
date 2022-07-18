import { Person } from "./Person"
import { ChildEntity, Column } from "typeorm"

@ChildEntity()
export class Men extends Person {
    @Column("varchar")
    beardColor: string
}
