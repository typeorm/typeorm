import { ChildEntity, ManyToOne } from "typeorm"
import { Contact } from "./Contact"
import { User } from "./User"

@ChildEntity("phone")
export class Phone extends Contact {
    @ManyToOne(() => User, (user) => user.phones)
    user: User
}
