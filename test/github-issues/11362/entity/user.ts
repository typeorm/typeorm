import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "user",
})
export class User {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ type: "number", nullable: true })
    public memberId: number | null
}
