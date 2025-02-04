import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "hygge",
})
export class Hygge {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    description: string
}
