import {GuildMember, Message} from "discord.js";
import {ArgsOf, On} from "discordx/build/esm/index.js";
import {Discord} from "discordx";

@Discord()
export class EventDeletedListener {

    private static deletedMessages = new WeakSet<Message>();
    private static deletedMembers = new WeakSet<GuildMember>();

    public static isMessageDeleted(message: Message): boolean {
        return EventDeletedListener.deletedMessages.has(message);
    }

    public static isMemberRemoved(member: GuildMember): boolean {
        return EventDeletedListener.deletedMembers.has(member);
    }

    @On("messageDelete")
    private messageDeleted([message]: ArgsOf<"messageDelete">): void {
        if (message.inGuild()) {
            EventDeletedListener.deletedMessages.add(message);
        }
    }

    @On("guildMemberRemove")
    private memberRemoved([member]: ArgsOf<"guildMemberRemove">): void {
        if (!member.partial) {
            EventDeletedListener.deletedMembers.add(member as GuildMember);
        }
    }
}
