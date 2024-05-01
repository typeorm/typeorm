import { Column, Entity, Index, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "user",
})
@Index(["firstName", "lastName"])
@Index(["lastName", "firstName"])
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    firstName: string

    @Column()
    lastName: string
}
