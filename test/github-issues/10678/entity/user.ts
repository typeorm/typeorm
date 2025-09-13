import { Column, Entity, Index, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "user",
})
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Index("IDX_name")
    @Column({ nullable: true })
    name: string
}
