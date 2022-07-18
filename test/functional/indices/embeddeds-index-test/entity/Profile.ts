import { Column } from "typeorm/decorator/columns/Column"
import { Index } from "typeorm/decorator/Index"

export class Profile {
    @Column()
    job: string

    @Column()
    @Index("customer_profile_address")
    address: string
}
