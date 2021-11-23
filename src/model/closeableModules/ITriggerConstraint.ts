import {ICloseableModule} from "./ICloseableModule.js";
import {IEventSecurityConstraint} from "../DB/IEventSecurityConstraint.js";
import {Message} from "discord.js";

export interface ITriggerConstraint extends ICloseableModule<any> {
    canTrigger(obj: IEventSecurityConstraint, message: Message): boolean;
}