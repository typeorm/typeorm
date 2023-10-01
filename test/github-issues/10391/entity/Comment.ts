import { Column } from "../../../../src"

export class Comment {
    @Column({ type: "string" })
    content!: string
}
