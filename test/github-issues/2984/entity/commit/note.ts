import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity({ name: "commitNote" })
export class Note {
    @PrimaryGeneratedColumn()
    public id: number
}
