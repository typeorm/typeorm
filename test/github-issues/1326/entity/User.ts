import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src/index"

@Entity({ database: "db_1" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
