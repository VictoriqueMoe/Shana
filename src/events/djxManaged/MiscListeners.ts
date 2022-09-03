import {ArgsOf, Discord, On} from "discordx";
import logger from "../../utils/LoggerFactory.js";
import {LogChannelManager} from "../../model/framework/manager/LogChannelManager.js";
import {injectable} from "tsyringe";
import {RestArgsOf} from "discordx/build/esm/types/public/common.js";
import rest = On.rest;

@Discord()
@injectable()
export class MiscListeners {

    public constructor(private _logManager: LogChannelManager) {
    }

    @rest()
    private rateLimited([rateLimitData]: RestArgsOf<"rateLimited">): void {
        const {limit, url, hash, majorParameter, method, route, timeToReset, global} = rateLimitData;
        logger.warn({
            limit,
            url,
            hash,
            majorParameter,
            method,
            route,
            timeToReset,
            global
        });
    }

    @On()
    private async threadCreate([thread]: ArgsOf<"threadCreate">): Promise<void> {
        if (!thread.joinable && !thread.joined) {
            await this._logManager.postToLog(`Unable to join created thread: "${thread.name}"`, thread.guildId);
            return;
        }
        try {
            await thread.join();
        } catch (e) {
            logger.error(e);
            await this._logManager.postToLog(`Unable to join created thread: "${thread.name}"`, thread.guildId);
            return;
        }
        await this._logManager.postToLog(`joined thread: "${thread.name}"`, thread.guildId);
    }
}
