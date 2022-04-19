import {ChildControllers, Controller, Get, Post} from "@overnightjs/core";
import {Request, Response} from 'express';
import {baseController} from "../BaseController";
import {DiscordUtils, EnumEx, ObjectUtil} from "../../../utils/Utils";
import {Channel, Guild, GuildBasedChannel, GuildChannel, GuildMember} from "discord.js";
import {StatusCodes} from "http-status-codes";
import {SETTINGS} from "../../../enums/SETTINGS";
import {SettingsManager} from "../../../model/framework/manager/SettingsManager";
import {ModuleController} from "./modules/impl/ModuleController";
import {AllCommands, CommandSecurityManager} from "../../../model/framework/manager/CommandSecurityManager";
import {container, singleton} from "tsyringe";
import {Client} from "discordx";
import {MuteManager} from "../../../model/framework/manager/MuteManager";

@singleton()
@Controller("api/bot")
@ChildControllers([
    new ModuleController()
])
export class BotController extends baseController {

    public constructor(private _client: Client) {
        super();
    }

    @Post("unMuteMembers")
    private async unMuteMembers(req: Request, res: Response): Promise<Response> {
        type payload = string[];
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const body: payload = req.body;
        for (const userId of body) {
            const member = await guild.members.fetch(userId);
            await member.timeout(null);
        }
        return super.ok(res, {});
    }


    @Post(/(banUsers|kickUsers)/)
    private async banUsers(req: Request, res: Response): Promise<Response> {
        type payload = {
            memberId: string,
            reason?: string
        }[];
        const body: payload = req.body;
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        for (const banInfo of body) {
            const {memberId, reason} = banInfo;
            let member: GuildMember = null;
            try {
                member = await guild.members.fetch(memberId);
            } catch {

            }
            if (member) {
                if (req.url === "/banUsers") {
                    if (member.bannable) {
                        await member.ban({
                            reason
                        });
                    }
                } else {
                    if (member.kickable) {
                        await member.kick(reason);
                    }
                }
            }
        }
        return super.ok(res, {});
    }


    @Post("setRolesForMembers")
    private async add(req: Request, res: Response): Promise<Response> {
        type payload = {
            "userId": string,
            "roleIds": string[]
        }[];
        const body: payload = req.body;
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        try {
            for (const p of body) {
                const {userId, roleIds} = p;
                let member: GuildMember;
                try {
                    member = await guild.members.fetch(userId);
                } catch {
                    continue;
                }
                for (const [roleId] of member.roles.cache) {
                    try {
                        await member.roles.remove(roleId);
                    } catch {
                    }
                }
                await member.roles.add(roleIds);
            }
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.BAD_REQUEST);
        }
        return super.ok(res, {});
    }

    @Get('allCommands')
    private async allCommands(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const securityManager = container.resolve(CommandSecurityManager);
        const commandClasses = securityManager.commands;
        const retObj: AllCommands = [];
        for (const commandModule of commandClasses) {
            const {name} = commandModule;
            commandModule["enabled"] = await securityManager.isEnabled(name, guild.id);
            retObj.push(commandModule);
        }
        return super.ok(res, retObj);
    }

    @Get('allGuilds')
    private async getAllGuilds(req: Request, res: Response): Promise<Response> {
        const guilds = this._client.guilds.cache;
        const obj = {};
        for (const [guildId, guild] of guilds) {
            obj[guildId] = guild.toJSON();
        }
        return super.ok(res, obj);
    }

    @Get('getSetting')
    private async getSetting(req: Request, res: Response): Promise<Response> {
        let setting = req.query.setting as string;
        if (!ObjectUtil.validString(setting)) {
            return super.doError(res, `Please supply a setting`, StatusCodes.BAD_REQUEST);
        }
        setting = setting.toUpperCase();
        const settingEnum = EnumEx.loopBack(SETTINGS, setting, true) as SETTINGS;
        if (!settingEnum) {
            return super.doError(res, `Setting: "${setting}" not found`, StatusCodes.NOT_FOUND);
        }
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const settingsManager = container.resolve(SettingsManager);
        const settingValue = await settingsManager.getSetting(settingEnum, guild.id);
        return super.ok(res, {
            [setting]: settingValue
        });
    }

    @Get('getAllRoles')
    private async getAllRoles(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        let roleArray = [...guild.roles.cache.values()];
        roleArray = roleArray.filter(role => {
            return !role.managed && role.id !== guild.roles.everyone.id;
        }).sort((a, b) => {
            return b.position - a.position;
        });
        const roleMap = roleArray.map(role => role.toJSON());
        return super.ok(res, roleMap);
    }

    @Get('getUsersFromRoles')
    private async getUsersFromRoles(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const roleRequested = req.query.roleId as string;
        const roles = await guild.roles.fetch(roleRequested);
        const objArr = [...roles.members.values()].map(member => {
            const json = member.toJSON();
            json["username"] = member.user.tag;
            return json;
        });
        return super.ok(res, objArr);
    }

    @Get('getMutes')
    private async getMutes(req: Request, res: Response): Promise<Response> {
        let guild: Guild;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const data: string[][] = [];
        const manager = container.resolve(MuteManager);
        const blockedMembers = await manager.getAllMutedMembers(guild.id);
        /*for (const member of blockedMembers) {
            const timeout = member.communicationDisabledUntilTimestamp;
            const user = member.user;
            let username = user.username;
            const appliedAudit = await manager.getAudit(member);
            const creatorTag = appliedAudit.executor.tag;
            let nickName = "N/A";
            if (member) {
                if (member.nickname) {
                    nickName = member.nickname;
                }
                if (member.user) {
                    username = member.user.tag;
                }
            }
            const timeLeft = timeout - (Date.now() - timeout);
            const tmeLeftStr = ObjectUtil.timeToHuman(timeLeft);
            data.push([null, username, nickName, tmeLeftStr, creatorTag, appliedAudit.reason, user.id]);
        }*/
        return super.ok(res, data);
    }

    @Get('getChannel')
    private async getChannel(req: Request, res: Response): Promise<Response> {
        try {
            const guild = await this.getGuild(req);
            const channel = await this.getChannelObject(req, guild);
            return super.ok(res, channel.toJSON() as Record<string, any>);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
    }

    @Get('getAllChannels')
    private async getAllChannels(req: Request, res: Response): Promise<Response> {
        let guild: Guild = null;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const allChannels = [...guild.channels.cache.values()];
        const ret: Record<string, any> = allChannels
            .filter(value => value instanceof GuildChannel)
            .sort((a: GuildBasedChannel, b: GuildBasedChannel) => (a as GuildChannel).rawPosition - (b as GuildChannel).rawPosition)
            .map(channel => channel.toJSON());

        return super.ok(res, ret);
    }


    @Get('getGuild')
    private async getGuildFromId(req: Request, res: Response): Promise<Response> {
        try {
            const guild = await this.getGuild(req);
            return super.ok(res, guild.toJSON() as Record<string, any>);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
    }

    private async getChannelObject(req: Request, guild: Guild): Promise<Channel> {
        const id = req.query.channelId as string;
        if (!ObjectUtil.validString(id)) {
            throw new Error("Please supply an ID");
        }
        let channel: Channel;
        try {
            channel = await guild.channels.resolve(id);
        } catch {
            throw new Error(`Channel with ID: ${id} not found`);
        }
        return channel;
    }

    @Get('getBotInfo')
    private async getBotInfo(req: Request, res: Response): Promise<Response> {
        const bot = this._client.user;
        if (!bot) {
            return super.doError(res, "Unable to fdind client", StatusCodes.INTERNAL_SERVER_ERROR);
        }
        let guild: Guild = null;
        let botMemeber: GuildMember;
        try {
            guild = await this.getGuild(req);
            botMemeber = await guild.members.fetch(bot);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        return super.ok(res, botMemeber.toJSON() as Record<string, any>);
    }


    @Get('getEmojis')
    private async getEmojis(req: Request, res: Response): Promise<Response> {
        let guild: Guild = null;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const emojiManager = guild.emojis;
        const pArr = [...emojiManager.cache.values()].map(async emoji => {
            const emojiInfo = await DiscordUtils.getEmojiInfo(emoji.id, false);
            emojiInfo["name"] = emoji.name;
            return emojiInfo;
        });
        const emojis = await Promise.all(pArr).then(values => {
            return values.map(v => {
                return {
                    "url": v.url,
                    "id": v.id,
                    // @ts-ignore
                    "name": v.name
                };
            });
        });
        return super.ok(res, emojis);
    }
}
