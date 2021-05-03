import {Controller, Delete, Get, Middleware, Post} from "@overnightjs/core";
import {Request, Response} from "express";
import {Guild} from "discord.js";
import {StatusCodes} from "http-status-codes";
import {AbstractModuleController} from "../AbstractModuleController";
import {EventSecurityConstraintTypeValidator} from "../../../middleWare/EventSecurityConstraintTypeValidator";
import {AutoResponderPayload} from "../../../../../model/types/Typeings";
import {AutoResponderModel} from "../../../../../model/DB/autoMod/impl/AutoResponder.model";
import {AutoResponderManager} from "../../../../../model/guild/manager/AutoResponderManager";


@Controller("module/autoResponder")
export class AutoResponderController extends AbstractModuleController {

    @Post("addAutoResponder")
    @Middleware(EventSecurityConstraintTypeValidator)
    private async addAutoResponder(req: Request, res: Response) {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const requestObject: AutoResponderPayload = req.body;
        requestObject.guildId = guild.id;
        try {
            await AutoResponderManager.instance.addAutoResponder(new AutoResponderModel(requestObject));
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
        return super.ok(res, {});
    }

    @Get("getAutoResponders")
    private async getAutoResponders(req: Request, res: Response) {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        try {
            const responders = await AutoResponderManager.instance.getAllAutoResponders(guild.id);
            return super.ok(res, responders);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }


    }

    @Delete("deleteAutoResponder")
    private async deleteAutoResponder(req: Request, res: Response) {

    }
}