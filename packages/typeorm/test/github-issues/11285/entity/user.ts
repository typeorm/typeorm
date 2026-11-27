import { Column, Entity, Index, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "user",
})
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Index()
    @Column({ type: "varchar", nullable: true })
    memberId: string
}
