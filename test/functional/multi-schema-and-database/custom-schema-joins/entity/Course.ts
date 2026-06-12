import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity({ schema: "myschema" })
export class Course {
    @PrimaryColumn()
    id: string

    @Column()
    name: string
}
