import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {Collection, Guild, GuildMember, Message, Role} from "discord.js";
import {ObjectUtil} from "../utils/Utils";

export const EnabledGuard = (moduleId: string) => async (args, client, next) => {
    function getGuildId(args): string {
        for (const arg of args) {
            if (arg instanceof Collection) {
                for (const [key, value] of arg) {
                    const g = getGuildId(key);
                    if (!ObjectUtil.validString(g)) {
                        const v = getGuildId(value);
                        if (ObjectUtil.validString(v)) {
                            return v;
                        }
                    } else {
                        return g;
                    }
                }
            } else if (arg instanceof GuildMember) {
                return arg.guild.id;
            } else if (arg instanceof Guild) {
                return arg.id;
            } else if (arg instanceof Role) {
                return arg.guild.id;
            } else if (arg instanceof Message) {
                return arg.guild.id;
            }
        }
        return null;
    }

    let guildId;
    try {
        guildId = getGuildId(args);
    } catch {
        return;
    }

    if (!ObjectUtil.validString(guildId)) {
        throw new Error("Unable to find guild");
    }
    const module = await CloseOptionModel.findOne({
        where: {
            moduleId,
            guildId
        }
    });
    if (module.status) {
        return await next();
    }
};