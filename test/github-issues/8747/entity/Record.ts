import { Column,CreateDateColumn, Entity, BaseEntity, JoinColumn, ManyToOne } from "../../../../src"
import { Car } from "./Car"

@Entity()
export class Record extends BaseEntity {
  @CreateDateColumn({ precision: 3, primary: true })
    timestamp: Date

  @Column({ type: 'uuid', primary: true })
    carUuid: string

  @ManyToOne(() => Car, car => car.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carUuid' })
    car: Car
}
