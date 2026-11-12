import {
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../../src"
import { Profile } from "./Profile"

@Entity("customer")
export class Customer {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => Profile)
    @JoinColumn()
    profile: Profile
}
