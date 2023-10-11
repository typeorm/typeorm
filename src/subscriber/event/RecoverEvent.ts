import { ObjectLiteral } from "../../common/ObjectLiteral"
import { RemoveEvent } from "./RemoveEvent"

/**
 * RecoverEvent is an object that broadcaster sends to the entity subscriber when entity is being recovered in the database.
 */
export interface RecoverEvent<Entity, EntityID = any, Data = ObjectLiteral>
    extends RemoveEvent<Entity, EntityID, Data> {}
