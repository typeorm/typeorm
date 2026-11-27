import { Column } from "../../../../../../src"

export class Meta {
    @Column({ type: String, nullable: true })
    note?: string
}
