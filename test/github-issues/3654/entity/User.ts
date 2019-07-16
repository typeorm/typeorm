import { StringDecoder } from "string_decoder";
import { Column, Entity, PrimaryColumn } from "../../../../src";

@Entity()
export class User {

    @PrimaryColumn("binary", {
        length: 16
    })
    public _id: Buffer;
    get id(): string {
        const decoder = new StringDecoder("hex");

        return decoder.end(this._id);
    }
    set id(value: string) {
        this._id = Buffer.from(value, "hex");
    }

    @Column()
    age: number;

}
