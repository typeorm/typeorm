import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "../../../../src"

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
