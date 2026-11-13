import {
    Entity,
    PrimaryColumn,
    DeleteDateColumn,
    VersionColumn,
} from "../../../../../src"

@Entity()
export class TransformedRecord {
    @PrimaryColumn({
        type: "uuid",
        transformer: {
            to: (value: string) => Buffer.from(value, "base64").toString("hex"),
            from: (value: string) =>
                Buffer.from(value.replaceAll("-", ""), "hex").toString(
                    "base64",
                ),
        },
    })
    id: string

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
