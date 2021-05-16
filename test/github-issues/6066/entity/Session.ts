import {Entity, PrimaryColumn} from "../../../../src";

@Entity()
export class Session {

    @PrimaryColumn({
        comment: "That's the way the cookie crumbles"
    })
    cookie: string = "";

}
