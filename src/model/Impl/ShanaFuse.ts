import Fuse from "fuse.js";
import {ArrayUtils, ObjectUtil} from "../../utils/Utils";
import type {SearchBase} from "../ISearchBase";

export class ShanaFuse<T extends SearchBase> extends Fuse<T> {
    public getFirstNItems(amount: number): Fuse.FuseResult<T>[] {
        const json = this.getIndex();
        // @ts-ignore
        const collection = json.docs as T[];
        if (!ArrayUtils.isValidArray(collection)) {
            return [];
        }
        const returnOb: Fuse.FuseResult<T>[] = [];
        let max = amount;
        const len = collection.length;
        for (let i = 0; i < max; i++) {
            if (i === len) {
                break;
            }
            const item = collection[i];
            if (!ObjectUtil.validString(item.name)) {
                max++;
                continue;
            }
            returnOb.push({
                refIndex: i,
                item: item
            });
        }
        return returnOb;
    }
}