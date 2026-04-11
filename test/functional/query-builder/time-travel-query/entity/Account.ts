import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../src/index"

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    balance: number
}
