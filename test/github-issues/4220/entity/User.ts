import {Entity, PrimaryColumn, Column} from "../../../../src";

@Entity({
  name: "USERS"
})
export class User {
    @PrimaryColumn({
        comment: "The ID of this user.",
        length: 16,
        type: "binary",
    })
    id: Buffer;

    @Column()
    name: string;
}
