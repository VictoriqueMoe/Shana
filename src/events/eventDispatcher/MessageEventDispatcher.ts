import {ArgsOf, Client, Discord, On} from "discordx";
import {MessageEntry} from "./MessageEntry";
import {Message} from "discord.js";
import {container, injectable} from "tsyringe";
import constructor from "tsyringe/dist/typings/types/constructor";

@Discord()
@injectable()
export class MessageEventDispatcher {

    public constructor(private _client: Client) {
    }

    private static readonly _messageListenerMap: Map<constructor<any>, MessageEntry[]> = new Map();

    public static get messageListenerMap(): Map<constructor<any>, MessageEntry[]> {
        return MessageEventDispatcher._messageListenerMap;
    }

    @On("messageCreate")
    private async eventTrigger([message]: ArgsOf<"messageCreate">, client: Client): Promise<void> {
        await this._client.executeCommand(message, {
            caseSensitive: false
        });
        return this.trigger(message, client, false);
    }


    @On("messageUpdate")
    private async messageUpdater([oldMessage, newMessage]: ArgsOf<"messageUpdate">, client: Client): Promise<void> {
        if (newMessage.author.bot) {
            return;
        }
        if (!(newMessage instanceof Message)) {
            try {
                newMessage = await newMessage.fetch();
            } catch {
                return;
            }
        }
        return this.trigger(newMessage, client, true);
    }

    private async trigger(message: Message, client: Client, isEdit: boolean = false): Promise<void> {
        const retArr: Promise<void>[] = [];
        for (const [context, entries] of MessageEventDispatcher._messageListenerMap) {
            const contextInstance = container.resolve(context);
            for (const entry of entries) {
                retArr.push(entry.trigger(message, client, contextInstance, isEdit));
            }
        }
        return Promise.all(retArr).then();
    }
}
