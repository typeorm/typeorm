import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity({ name: "public.table.user" })
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    github: string
}
