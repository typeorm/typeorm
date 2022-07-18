import { Entity, PrimaryGeneratedColumn } from "../typeorm"

@Entity()
export class Breed {
    @PrimaryGeneratedColumn()
    id: number
}
