import type {Request, Response} from "express";
import {getReasonPhrase, StatusCodes} from "http-status-codes";
import type {Guild} from "discord.js";
import {ObjectUtil} from "../../utils/Utils";
import {Client} from "discordx";
import {container} from "tsyringe";

export abstract class baseController {

    protected doError(res: Response, message: string, status: StatusCodes): Response {
        return res.status(status).json({
            error: `${status} ${getReasonPhrase(status)}`,
            message: message
        });
    }

    protected ok(res: Response, json: Record<string, any>): Response {
        const serialisedJson: string = JSON.stringify(json);
        res.setHeader('Content-Type', 'application/json');
        return res.status(StatusCodes.OK).send(serialisedJson);
    }

    protected async getGuild(req: Request): Promise<Guild> {
        let id = req.query.id as string;
        if (!ObjectUtil.validString(id)) {
            throw new Error("Please supply an ID");
        }
        const client = container.resolve(Client);
        if (id.includes("?")) {
            id = id.split("?").shift();
        }
        let guild: Guild = null;
        let guildFound: boolean;
        try {
            guild = await client.guilds.fetch(id);
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
