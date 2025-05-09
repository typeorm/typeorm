import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src/index";

export const OLD_COLLATION = "C";
export const NEW_COLLATION = "C.utf8";


@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 100, collation: OLD_COLLATION })
    name: string;
}