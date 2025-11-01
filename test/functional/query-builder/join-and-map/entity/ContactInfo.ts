import { Column } from "../../../../../src/decorator/columns/Column"

export class ContactInfo {
    @Column({ nullable: true })
    email: string

    @Column({ nullable: true })
    phone: string
}
