import {singleton} from "tsyringe";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import emojiRegex from "emoji-regex";

@singleton()
export class EmojiManager {

    public stripAllEmojiFromText(message: Message | string): string {
        let retStr = typeof message === "string" ? message : message.content;
        retStr = `${retStr}`;
        if (!ObjectUtil.validString(retStr)) {
            return retStr;
        }
        const emojis = this.getEmojiFromMessage(retStr, true);
        for (const emoji of emojis) {
            retStr = retStr.replace(emoji, "");
        }
        return retStr.trim();
    }

    public getEmojiFromMessage(message: Message | string, includeDefaultEmoji = true): string[] {
        const regex = new RegExp(/<(a?):(\w+):(\d+)>/, "g");
        const messageText = typeof message === "string" ? message : message.content;
        const emojiArray = messageText.match(regex) || [];
        if (includeDefaultEmoji) {
            const emoJiRexp = emojiRegex();
            let match: string[];
            while ((match = emoJiRexp.exec(messageText)) !== null) {
                const emoji = match[0];
                emojiArray.push(emoji);
            }
        }
        return emojiArray;
    }
}
