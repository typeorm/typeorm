import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column({ type: Number, array: true })
    favoriteNumbers: number[]
}
