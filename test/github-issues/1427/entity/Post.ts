import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "decimal", precision: 10, scale: 6 })
    qty: string
}
