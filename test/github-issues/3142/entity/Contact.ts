import { Column } from "typeorm"

export class Contact {
    @Column({ unique: true })
    email: string
}
