import { Column, Entity, ManyToOne, PrimaryColumn } from "../../../../src"
import { User } from "./User"
import { StringDecoder } from "string_decoder"

@Entity()
export class Photo {
    @PrimaryColumn("binary", {
        length: 2,
    })
    private _id: Buffer

    get id(): string {
        const decoder = new StringDecoder("hex")

        return decoder.end(this._id)
    }
    set id(value: string) {
        this._id = Buffer.from(value, "hex")
    }

    @Column()
    description: string

    @ManyToOne((type) => User, (user) => user.photos)
    user: User
}
