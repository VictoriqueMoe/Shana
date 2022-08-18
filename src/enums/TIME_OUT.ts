import {ObjectUtil} from "../utils/Utils.js";
import TIME_UNIT from "./TIME_UNIT.js";

enum TIME_OUT {
    "60 seconds" = ObjectUtil.convertToMilli(60, TIME_UNIT.seconds),
    "5 min" = ObjectUtil.convertToMilli(5, TIME_UNIT.minutes),
    "10 min" = ObjectUtil.convertToMilli(10, TIME_UNIT.minutes),
    "1 hour" = ObjectUtil.convertToMilli(1, TIME_UNIT.hours),
    "1 day" = ObjectUtil.convertToMilli(1, TIME_UNIT.days),
    "1 week" = ObjectUtil.convertToMilli(1, TIME_UNIT.weeks)
}

export default TIME_OUT;
