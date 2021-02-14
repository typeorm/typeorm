import { Entity } from "../../../../src/decorator/entity/Entity";
import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ type: "varchar", length: 100 })
    first_name: string;
    @Column({ type: "varchar", length: 100 })
    last_name: string;
}
