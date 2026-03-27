import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity()
export class TransportUnitType {
    @PrimaryColumn("uuid")
    id: string

    @Column()
    name: string
}
