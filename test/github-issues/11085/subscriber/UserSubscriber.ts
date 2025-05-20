import { EntitySubscriberInterface, EventSubscriber } from "../../../../src"
import { BeforeQueryEvent } from "../../../../src/subscriber/event/QueryEvent"
import { User } from "../entity/User"

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<any> {
    async beforeQuery(event: BeforeQueryEvent<any>): Promise<void> {
        if (event.query.includes('FROM "user"')) {
            const userRepository = await event.manager.getRepository(User)

            await userRepository.insert({
                firstName: "John",
                lastName: "Doe",
                isActive: true,
            })
        }
    }
}
