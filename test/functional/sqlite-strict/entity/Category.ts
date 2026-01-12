import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({ strict: false })
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
