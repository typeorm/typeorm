import { commonUtils } from "../utils/CommonUtils";
import { BeginsWith } from "../models/FindOptions";
import { poundToUnderscore } from "./TextHelper";

export const attributeHelper = {

    toAttributeNames (object: any, beginsWith?: BeginsWith, attributeNames?: any) {
        if (commonUtils.isNotEmpty(object)) {
            attributeNames = attributeNames || {};
            const keys = Object.keys(object);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                attributeNames[`#${poundToUnderscore(key)}`] = key;
            }
        }
        if (beginsWith) {
            attributeNames[`#${poundToUnderscore(beginsWith.attribute)}`] = beginsWith.attribute;
        }
        return attributeNames;
    }

};

export default attributeHelper;
