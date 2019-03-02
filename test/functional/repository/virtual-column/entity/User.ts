import { Entity } from "../../../../../src/decorator/entity/Entity";
import { Column, ColumnName, PrimaryGeneratedColumn } from "../../../../../src";
import { concat } from "./utils";


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: true,
        asVirtual: (names: ColumnName<User>, type) => {
            try {
                return concat(type, names.firstName, "'-'", names.lastName);
            } catch {
                return "'not implemented!'";
            }
        }
    })
    fullName: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;
}
