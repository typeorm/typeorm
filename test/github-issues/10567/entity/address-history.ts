import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from '../../../../src';

@Entity()
export class AddressHistory {
  @PrimaryGeneratedColumn('uuid')
  uuid: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ type: 'uuid' })
  entityUuid: string

  @Column({ type: 'uuid' })
  addressUuid: string

  @Index({ spatial: true })
  @Column({ type: 'daterange' })
  daterange: string

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true
  })
  point: string
}
