import { Column, Entity, PrimaryColumn } from "@typeorm/core";
import { URL } from "url";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @Column("varchar", {
        // marshall
        transformer: {
            from(value: string): URL {
                return new URL(value);
            },
            to(value: URL): string {
                return value.toString();
            },
        },
    })
    url: URL;

}
