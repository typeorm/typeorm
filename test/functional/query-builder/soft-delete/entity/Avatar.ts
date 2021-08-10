import { Entity } from "../../../../../src/decorator/entity/Entity";
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn";
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Column } from "../../../../../src/decorator/columns/Column";

@Entity()
export class Avatar {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @DeleteDateColumn()
    deletedAt: Date;
}
