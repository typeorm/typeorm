import {
    BaseEntity,
    Column,
    Entity,
    // EntitySubscriberInterface,
    // EventSubscriber,
    PrimaryGeneratedColumn,
    // UpdateEvent,
} from "../../../../src"

// entity
@Entity()
export class MyEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    normalCol: string

    @Column({ select: false })
    selectFalseCol: string

    // ...other columns
}

// subscriber to register
// @EventSubscriber()
// export class MyEntitySubscriber implements EntitySubscriberInterface<MyEntity> {
//     listenTo() {
//         return MyEntity
//     }

//     async afterUpdate(event: UpdateEvent<MyEntity>) {
//         console.log(event.entity)
//     }
// }
