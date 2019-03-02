import { Entity } from "../../../../../src/decorator/entity/Entity";
import { Column, ColumnName, PrimaryGeneratedColumn } from "../../../../../src";
import { summary } from "./utils";


@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        asVirtual: (names: ColumnName<Post>, type) => {
            try {
                return summary(type, names.body, 10);
            } catch {
                return "'not implemented!'";
            }
        }
    })
    summary: string;


    @Column()
    body: string;
}
