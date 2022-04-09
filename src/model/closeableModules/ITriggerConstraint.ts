import {ICloseableModule} from "./ICloseableModule";
import {IEventSecurityConstraint} from "../DB/entities/IEventSecurityConstraint";
import {Message} from "discord.js";

export interface ITriggerConstraint extends ICloseableModule<any> {
    canTrigger(obj: IEventSecurityConstraint, message: Message): boolean;
}
