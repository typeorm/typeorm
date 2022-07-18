import { Column, PrimaryGeneratedColumn, Entity } from "typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    name2: string
}
