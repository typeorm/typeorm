import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Party {
    @PrimaryGeneratedColumn("uuid")
    id: string
}
