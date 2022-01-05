import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src";
import { CartItems } from "./CartItems";

@Entity()
export class Cart {
    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    UNID!: number;

    @Column()
    Type!: string;

    @Column()
    Cycle?: number;

    @Column()
    Term?: string;

    @Column()
    RegDate!: Date;

    @Column()
    ModifiedDate!: Date;

    @OneToMany((type) => CartItems, (t) => t.Cart)
    CartItems?: CartItems[];
}
