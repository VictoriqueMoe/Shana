import {Client, GuardFunction, Next} from "discordx";
import {CommandInteraction} from "discord.js";
import {DiscordUtils} from "../utils/Utils.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

export function AttachmentAllowedFileTypes(types: string[], attachmentName: string): GuardFunction<CommandInteraction> {
    return function (arg: CommandInteraction, client: Client, next: Next): Promise<unknown> {
        const option = arg.options.get(attachmentName, true);
        const attachment = option.attachment;
        if (!attachment) {
            return next();
        }
        const fileExt = attachment.name.split(".").pop();
        if (!types.includes(fileExt)) {
            InteractionUtils.replyOrFollowUp(arg, {
                content: "Could not detect filetype",
                ephemeral: true
            });
            return;
        }
        if (types.includes(attachment.name.split(".").pop())) {
            return next();
        }
        InteractionUtils.replyOrFollowUp(arg, {
            content: `Filetype "${fileExt}" not allowed, only allowed are ${types.join(", ")}`,
            ephemeral: true
        });
    };
}
