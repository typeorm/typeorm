import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "user",
})
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
