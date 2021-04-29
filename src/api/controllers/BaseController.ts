import {Request, Response} from "express";
import {getReasonPhrase, StatusCodes} from "http-status-codes";
import {Guild} from "discord.js";
import {ObjectUtil} from "../../utils/Utils";
import {Main} from "../../Main";

export abstract class baseController {

    protected doError(res: Response, message: string, status: StatusCodes): Response {
        return res.status(status).json({
            error: `${status} ${getReasonPhrase(status)}`,
            message: message
        });
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    protected ok(res: Response, json: object): Response {
        return res.status(StatusCodes.OK).json(json);
    }

    protected async getGuild(req: Request): Promise<Guild> {
        const id = req.query.id as string;
        if (!ObjectUtil.validString(id)) {
            throw new Error("Please supply an ID");
        }
        let guild: Guild = null;
        let guildFound: boolean;
        try {
            guild = await Main.client.guilds.fetch(id);
            guildFound = true;
        } catch {
            guildFound = false;
        }
        if (!guildFound) {
            throw new Error(`Guild with ID: ${id} not found`);
        }
        return guild;
    }
}
