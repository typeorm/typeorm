import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    createdAt: Date
}
