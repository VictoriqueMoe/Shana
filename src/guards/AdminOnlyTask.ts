import {GuardFunction} from "@typeit/discord";
import {GuildUtils} from "../utils/Utils";

//TODO: get someone who is NOT an admin to test this guard
export const AdminOnlyTask: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    if(GuildUtils.isMemberAdmin(message.member)){
        await next();
        return;
    }
    message.reply("you do not have permissions to use this command");
};