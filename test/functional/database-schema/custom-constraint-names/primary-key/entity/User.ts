import { Entity, PrimaryGeneratedColumn } from "../typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: "PK_ID" })
    id: number
}
