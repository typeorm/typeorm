import path from "node:path"
import type { AfterQueryEvent, BeforeQueryEvent } from "../../../../src"
import { EntitySubscriberInterface, EventSubscriber } from "../../../../src"
import { PlatformTools } from "../../../../src/platform/PlatformTools"
import { Post } from "../entity/Post"

export const beforeQueryLogPath = path.join(
    process.cwd(),
    "temp/before-query.log",
)
export const afterQueryLogPath = path.join(
    process.cwd(),
    "temp/after-query.log",
)

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post
    }

    beforeQuery(event: BeforeQueryEvent): void {
        PlatformTools.appendFileSync(beforeQueryLogPath, event.query)
    }

    afterQuery(event: AfterQueryEvent): void {
        PlatformTools.appendFileSync(afterQueryLogPath, event.query)
    }
}
