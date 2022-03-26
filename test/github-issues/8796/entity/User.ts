import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class User {
    @PrimaryColumn({ type: "int", nullable: false })
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    github: string
}
