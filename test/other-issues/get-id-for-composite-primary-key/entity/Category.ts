import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn("increment")
    id!: number

    @Column()
    name!: string
}
