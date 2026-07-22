import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Todo {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "bigint",
        default: () => "EXTRACT(EPOCH FROM now()) * 1000",
    })
    updatedAt: string
}
