import { Index } from "typeorm/decorator/Index"
import { Entity } from "typeorm/decorator/entity/Entity"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Message } from "./Message"
import { Locale } from "./Locale"
import { PrimaryColumn } from "typeorm"

@Entity()
@Index(["locale", "message"], { unique: true })
export class Translation {
    @PrimaryColumn()
    localeCode: string

    @PrimaryColumn()
    messageId: string

    @ManyToOne(() => Locale, { nullable: false })
    @JoinColumn()
    locale: Locale

    @ManyToOne(() => Message, { nullable: false })
    @JoinColumn()
    message: Message

    @Column("text")
    text: string
}
