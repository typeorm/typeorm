import { Column, PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm"

enum UserType {
    ADMIN = "ADMIN",
    USER = "USER",
}

@Entity("user")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "enum", enum: UserType })
    userType: UserType
}
