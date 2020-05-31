import {Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity({ name: "user_type", database: "test" })
export class UserType {
    @PrimaryGeneratedColumn()
    id: number;
}
