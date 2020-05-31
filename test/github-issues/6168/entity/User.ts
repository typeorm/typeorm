import {Entity, PrimaryGeneratedColumn, ManyToOne} from "../../../../src";
import { UserType } from "./UserType";

@Entity({ name: "user", database: "test" })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserType, { onUpdate: "CASCADE", onDelete: "CASCADE" })
    type: UserType;
}
