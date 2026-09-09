import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    name: string
}
