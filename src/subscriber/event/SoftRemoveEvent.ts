import { ObjectLiteral } from "../../common/ObjectLiteral"
import { RemoveEvent } from "./RemoveEvent"

/**
 * SoftRemoveEvent is an object that broadcaster sends to the entity subscriber when entity is being soft removed to the database.
 */
export interface SoftRemoveEvent<Entity, EntityID = any, Data = ObjectLiteral>
    extends RemoveEvent<Entity, EntityID, Data> {}
