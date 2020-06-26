import { Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Session {

    @PrimaryColumn({
        comment: "That's the way the cookie crumbles"
    })
    cookie: string = "";

}
