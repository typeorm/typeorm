import { Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Session {
    @PrimaryColumn({
        comment: "That's the way the cookie crumbles",
    })
    cookie: string = ""
}
