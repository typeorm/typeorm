import { ChildEntity, ManyToOne } from "typeorm"
import { Contact } from "./Contact"
import { User } from "./User"

@ChildEntity("email")
export class Email extends Contact {
    @ManyToOne(() => User, (user) => user.emails)
    user: User
}
