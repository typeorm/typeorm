import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { User } from "./User"

export class Meta {
    @ManyToOne(() => User, { eager: true, nullable: true })
    owner: User | null
}
