import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";
import { Message } from "./Message";

@Entity()
export class Locale {

    @PrimaryColumn("varchar", {length: 5})
    code: string;

    @Column("varchar", {length: 50})
    englishName: string;

    @OneToOne(() => Message, {onDelete: "SET NULL"})
    @JoinColumn()
    name: Message;

}
