import { Column, Entity, PrimaryGeneratedColumn } from "typeorm/index"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
