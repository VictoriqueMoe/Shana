import {ArgsOf, Client, Discord, On} from "discordx";
import {PostConstruct} from "../../model/framework/decorators/PostConstruct.js";
import logger from "../../utils/LoggerFactory.js";
import {LogChannelManager} from "../../model/framework/manager/LogChannelManager.js";
import {injectable} from "tsyringe";

@Discord()
@injectable()
export class MiscListeners {

    public constructor(private _logManager: LogChannelManager) {
    }

    @PostConstruct
    private initRestListeners(client: Client): void {
        client.rest.on('rateLimited', rateLimitData => {
            logger.warn(rateLimitData);
        });
    }

    @On({
        event: "threadCreate"
    })
    private async threadCreate([thread]: ArgsOf<"threadCreate">): Promise<void> {
        if (!thread.joinable && !thread.joined) {
            await this._logManager.postToLog(`Unable to join created thread: "${thread.name}"`, thread.guildId);
            return;
        }
        try {
            await thread.join();
        } catch (e) {
            console.error(e);
            await this._logManager.postToLog(`Unable to join created thread: "${thread.name}"`, thread.guildId);
            return;
        }
        await this._logManager.postToLog(`joined thread: "${thread.name}"`, thread.guildId);
    }
}
