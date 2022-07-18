import { Entity, PrimaryGeneratedColumn } from "../typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number
}
