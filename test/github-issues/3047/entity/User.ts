import { Column, Entity, Index, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
@Index("unique_idx", ["first_name", "last_name"], {unique: true})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({type: "varchar", length: 100})
    first_name: string;
    @Column({type: "varchar", length: 100})
    last_name: string;
    @Column({type: "varchar", length: 100})
    is_updated: string;
}
