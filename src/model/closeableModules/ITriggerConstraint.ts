import type {ICloseableModule} from "./ICloseableModule";
import type {IEventSecurityConstraint} from "../DB/entities/IEventSecurityConstraint";
import type {Message} from "discord.js";

export interface ITriggerConstraint extends ICloseableModule<any> {
    canTrigger(obj: IEventSecurityConstraint, message: Message): boolean;
}
