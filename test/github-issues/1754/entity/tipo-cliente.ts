import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Cliente } from "./cliente";

@Entity()
export class TipoCliente {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "tipo"})
    descricao: string;

    @OneToMany(() => Cliente, c => c.tipo)
    clientes: Cliente[];

}
