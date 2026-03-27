import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity()
export class Material {
    @PrimaryColumn("uuid")
    id: string

    @Column()
    name: string
}
