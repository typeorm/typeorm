import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";

const JSON_TRANSFORMER = {
    from: (value : string) => JSON.parse(value),
    to: (value: any) => JSON.stringify(value)
}

/**
 * For testing Postgres jsonb
 */
@Entity()
export class Record {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "json", nullable: true, jsonType: 'string', transformer: JSON_TRANSFORMER })
    config: any;

    @Column({ type: "jsonb", nullable: true, jsonType: 'string', transformer: JSON_TRANSFORMER })
    data: any;

    @Column({ type: "jsonb", nullable: true, default: { hello: "world", foo: "bar" }, jsonType: 'string', transformer: JSON_TRANSFORMER })
    dataWithDefaultObject: any;

    @Column({ type: "jsonb", nullable: true, default: null, jsonType: 'string', transformer: JSON_TRANSFORMER })
    dataWithDefaultNull: any;

    @Column({ type: "jsonb", nullable: true })
    raw: string;
}
