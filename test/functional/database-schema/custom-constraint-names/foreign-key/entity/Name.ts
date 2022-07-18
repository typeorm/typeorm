import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Name {
    @PrimaryGeneratedColumn()
    id: number
}
