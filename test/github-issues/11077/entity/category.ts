import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "category",
})
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string
}
