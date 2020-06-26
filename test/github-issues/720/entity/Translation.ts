import { Column, Entity, Index, JoinColumn, ManyToOne } from "@typeorm/core";
import { Message } from "./Message";
import { Locale } from "./Locale";

@Entity()
@Index(["locale", "message"], {unique: true})
export class Translation {

    @ManyToOne(() => Locale, {primary: true, nullable: false})
    @JoinColumn()
    locale: Locale;

    @ManyToOne(() => Message, {primary: true, nullable: false})
    @JoinColumn()
    message: Message;

    @Column("text")
    text: string;
}
