import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { TipoCliente } from "./tipo-cliente";

@Entity()
export class Cliente {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @ManyToOne(() => TipoCliente, tc => tc.clientes)
    @JoinColumn({name: "tipoCliente"})
    tipo: TipoCliente;

}
