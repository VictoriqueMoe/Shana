import {ICloseableModule} from "./ICloseableModule";
import {IEventSecurityConstraint} from "../DB/IEventSecurityConstraint";
import {Message} from "discord.js";

export interface ITriggerConstraint extends ICloseableModule {
    canTrigger(obj: IEventSecurityConstraint, message: Message): boolean;
}