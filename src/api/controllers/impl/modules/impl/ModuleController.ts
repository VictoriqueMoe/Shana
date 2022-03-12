import {AbstractModuleController} from "../AbstractModuleController";
import {ChildControllers, Controller, Get, Post} from "@overnightjs/core";
import {AutoResponderController} from "./AutoResponderController";
import {Request, Response} from "express";
import {Guild} from "discord.js";
import {StatusCodes} from "http-status-codes";
import {CloseOptionModel} from "../../../../../model/DB/autoMod/impl/CloseOption.model";
import {ArrayUtils, ObjectUtil} from "../../../../../utils/Utils";
import {AutoRoleController} from "./AutoRoleController";
import {getRepository} from "typeorm";
import {container} from "tsyringe";
import {CloseableModuleManager} from "../../../../../model/guild/manager/CloseableModuleManager";


@Controller("module")
@ChildControllers([
    new AutoResponderController(),
    new AutoRoleController()
])
export class ModuleController extends AbstractModuleController {

    @Get('getModules')
    private async getModules(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const moduleId = req.query.moduleId as string;
        let allModules: CloseOptionModel[] = [];
        const closeOptionRepo = getRepository(CloseOptionModel);
        //TODO make this a manager
        if (ObjectUtil.validString(moduleId)) {
            const found = await closeOptionRepo.findOne({
                where: {
                    guildId: guild.id,
                    moduleId
                }
            });
            if (found) {
                allModules.push(found);
            }
        } else {
            allModules = await closeOptionRepo.find({
                where: {
                    guildId: guild.id
                }
            });
        }
        if (!ArrayUtils.isValidArray(allModules)) {
            return super.doError(res, "Unable to find module", StatusCodes.NOT_FOUND);
        }
        return super.ok(res, allModules);
    }

    @Post("changeModuleStatus")
    private async changeModuleStatus(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const moduleStatusArray: {
            [moduleId: string]: boolean,
        }[] = req.body;
        try {
            for (const item of moduleStatusArray) {
                const moduleStatus = Object.values(item)[0];
                const moduleId = Object.keys(item)[0];
                const module = container.resolve(CloseableModuleManager).getModule(moduleId);
                try {
                    if (moduleStatus) {
                        await module.open(guild.id);
                    } else {
                        await module.close(guild.id);
                    }
                } catch {
                    throw new Error(moduleId);
                }
            }
        } catch (e) {
            return super.doError(res, `Unable to start module "${e.message}"`, StatusCodes.INTERNAL_SERVER_ERROR);
        }
        return super.ok(res, {});
    }
}
