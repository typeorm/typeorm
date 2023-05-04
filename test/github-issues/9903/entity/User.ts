import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn("increment")
    id?: number

    @Column({ type: "json" })
    jsonData: string
}
