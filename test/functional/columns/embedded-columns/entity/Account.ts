import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
