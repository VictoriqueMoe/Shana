import {Controller, Get} from "@overnightjs/core";
import {Request, Response} from 'express';
import {Main} from "../../../Main";
import {AbstractController} from "../AbstractController";

@Controller("api/bot")
export class BotController extends AbstractController{

    @Get('allGuilds')
    private async asyncThirdParty(req: Request, res: Response) {
        const guilds = Main.client.guilds.cache;
        const obj = {};
        for(const [guildId, guild] of guilds){
            obj[guildId] = guild.toJSON();
        }
        return res.status(200).json(obj);
    }
}