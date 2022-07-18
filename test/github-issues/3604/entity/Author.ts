import { PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm"

@Entity()
export class Author {
    @PrimaryGeneratedColumn("uuid")
    id: string
}
