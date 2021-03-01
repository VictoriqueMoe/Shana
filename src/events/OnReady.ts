import {On} from "@typeit/discord";
import {Main} from "../Main";
import {VicDropbox} from "../model/dropbox/VicDropbox";
import {MuteModel} from "../model/DB/autoMod/impl/Mute.model";
import {Op} from "sequelize";
import {GuildUtils, ObjectUtil} from "../utils/Utils";
import {Guild} from "discord.js";
import {UsernameModel} from "../model/DB/autoMod/impl/Username.model";
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {BaseDAO, UniqueViolationError} from "../DAO/BaseDAO";
import {MuteSingleton} from "../commands/autoMod/userBlock/MuteSingleton";

/**
 * TODO: couple this class to appropriate classes
 */
export abstract class OnReady extends BaseDAO<any> {

    @On("ready")
    private async initialize(): Promise<void> {
        await Main.client.user.setActivity('Anime', {type: 'WATCHING'});
        await Main.dao.sync({force: false});
        await VicDropbox.instance.index();
        await OnReady.initiateMuteTimers();
        await this.initUsernames();
        await this.populateClosableEvents();
        console.log("Bot logged in.");
    }

    private async initUsernames(): Promise<void> {
        const allModels = await UsernameModel.findAll();
        const guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        const pArr = allModels.map(model => {
            return guild.members.fetch(model.userId).then(member => {
                return member.setNickname(model.usernameToPersist);
            }).then(member => {
                console.log(`Set username for "${member.user.username}" to "${model.usernameToPersist}"`);
            }).catch(reason => {
                console.log(`Unable to set username for user ${model.userId} as they no longer exist in this guild`);
            });
        });

        await Promise.all(pArr);
        console.log("set all Usernames");
    }

    private static async initiateMuteTimers(): Promise<void> {
        const mutesWithTimers = await MuteModel.findAll({
            where: {
                timeout: {
                    [Op.not]: null
                }
            }
        });
        const now = Date.now();
        for (const mute of mutesWithTimers) {
            const muteCreated = (mute.createdAt as Date).getTime();
            const timerLength = mute.timeout;
            const timeLeft = timerLength - (now - muteCreated);
            const guild: Guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
            if (timeLeft <= 0) {
                console.log(`Timer has expired for user ${mute.username}, removing from database`);
                await MuteModel.destroy({
                    where: {
                        id: mute.id
                    }
                });
            } else {
                console.log(`Re-creating timed mute for ${mute.username}, time reamining is: ${ObjectUtil.secondsToHuman(Math.round(timeLeft / 1000))}`);
                MuteSingleton.instance.createTimeout(mute.userId, mute.username, timeLeft, guild);
            }
        }
    }

    private async populateClosableEvents(): Promise<void> {
        const allModules = Main.closeableModules;
        for (const module of allModules) {
            const moduleId = module.moduleId;
            const exists = await CloseOptionModel.findOne({
                where: {
                    moduleId
                }
            });
            if (!exists) {
                const m = new CloseOptionModel({
                    moduleId
                });
                try {
                    await super.commitToDatabase(m);
                } catch (e) {
                    if (!(e instanceof UniqueViolationError)) {
                        throw e;
                    }
                }
            }
        }
    }
}