import {Controller, Delete, Get, Middleware, Post} from "@overnightjs/core";
import {Request, Response} from "express";
import {Guild} from "discord.js";
import {StatusCodes} from "http-status-codes";
import {AbstractModuleController} from "../AbstractModuleController";
import {EventSecurityConstraintTypeValidator} from "../../../middleWare/EventSecurityConstraintTypeValidator";
import {AutoResponderPayload} from "../../../../../model/types/Typeings";
import {AutoResponderModel} from "../../../../../model/DB/autoMod/impl/AutoResponder.model";
import {AutoResponderManager} from "../../../../../model/guild/manager/AutoResponderManager";
import {container} from "tsyringe";
import {BaseDAO} from "../../../../../DAO/BaseDAO";


@Controller("autoResponder")
export class AutoResponderController extends AbstractModuleController {

    private readonly _autoResponderManager: AutoResponderManager;

    public constructor() {
        super();
        this._autoResponderManager = container.resolve(AutoResponderManager);
    }

    @Post("editAutoResponder")
    @Middleware(EventSecurityConstraintTypeValidator)
    private async editAutoResponder(req: Request, res: Response): Promise<Response> {
        type Edit = AutoResponderPayload & {
            currentTitle: string;
        };
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const requestObject: Edit = req.body;
        requestObject.guildId = guild.id;
        try {
            await this._autoResponderManager.editAutoResponder(BaseDAO.build(AutoResponderModel, requestObject), requestObject.currentTitle);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
        return super.ok(res, {});
    }

    @Post("addAutoResponder")
    @Middleware(EventSecurityConstraintTypeValidator)
    private async addAutoResponder(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const requestObject: AutoResponderPayload = req.body;
        requestObject.guildId = guild.id;
        try {
            await this._autoResponderManager.addAutoResponder(BaseDAO.build(AutoResponderModel, requestObject));
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
        return super.ok(res, {});
    }

    @Get("getAutoResponders")
    private async getAutoResponders(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        try {
            const responders = await this._autoResponderManager.getAllAutoResponders(guild.id);
            const json = responders.map(value => JSON.stringify(value));
            return super.ok(res, json);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete("deleteAutoResponder")
    private async deleteAutoResponder(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const responderTitle = req.body.title;
        const didDelete = await this._autoResponderManager.deleteAutoResponse(guild.id, responderTitle);
        if (didDelete) {
            return super.ok(res, {});
        }
        return super.doError(res, `Unable to delete ${responderTitle}`, StatusCodes.BAD_REQUEST);
    }
}