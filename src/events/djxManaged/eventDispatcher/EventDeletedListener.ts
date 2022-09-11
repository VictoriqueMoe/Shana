import type {GuildMember, Message} from "discord.js";
import {PartialGuildMember, PartialMessage} from "discord.js";
import type {ArgsOf} from "discordx";
import {Discord, On} from "discordx";

@Discord()
export class EventDeletedListener {

    private static readonly deletedMessages: WeakSet<Message | PartialMessage> = new WeakSet();
    private static readonly deletedMembers: WeakSet<GuildMember | PartialGuildMember> = new WeakSet();

    public static isMessageDeleted(message: Message | PartialMessage): boolean {
        return EventDeletedListener.deletedMessages.has(message);
    }

    public static isMemberRemoved(member: GuildMember | PartialGuildMember): boolean {
        return EventDeletedListener.deletedMembers.has(member);
    }

    @On()
    private messageDelete([message]: ArgsOf<"messageDelete">): void {
        EventDeletedListener.deletedMessages.add(message);
    }

    @On()
    private guildMemberRemove([member]: ArgsOf<"guildMemberRemove">): void {
        EventDeletedListener.deletedMembers.add(member);
    }
}
