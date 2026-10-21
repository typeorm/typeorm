import { Entity, PrimaryGeneratedColumn } from "../../../../../../../src"

@Entity("profile")
export class Profile {
    @PrimaryGeneratedColumn()
    id: number
}
