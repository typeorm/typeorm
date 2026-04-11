import { EntitySubscriberInterface, EventSubscriber } from "../../../../src"
import { BeforeQueryEvent } from "../../../../src/subscriber/event/QueryEvent"
import { User } from "../entity/User"

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface {
    async beforeQuery(event: BeforeQueryEvent): Promise<void> {
        if (event.query.includes('FROM "user"')) {
            const userRepository = event.manager.getRepository(User)

            await userRepository.insert({
                firstName: "John",
                lastName: "Doe",
                isActive: true,
            })
        }
    }
}
