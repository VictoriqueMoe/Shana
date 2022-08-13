import type {ICloseableModule} from "./ICloseableModule.js";
import type {IEventSecurityConstraint} from "../DB/entities/IEventSecurityConstraint.js";
import type {Message} from "discord.js";

export interface ITriggerConstraint extends ICloseableModule<any> {
    canTrigger(obj: IEventSecurityConstraint, message: Message): boolean;
}
