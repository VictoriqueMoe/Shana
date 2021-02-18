import {On} from "@typeit/discord";
import {Main} from "../Main";
import {Sequelize} from "sequelize-typescript";
import {VicDropbox} from "../model/dropbox/VicDropbox";
import {MuteModel} from "../model/DB/autoMod/impl/Mute.model";
import {Op} from "sequelize";
import {GuildUtils, ObjectUtil} from "../utils/Utils";
import {Guild, User} from "discord.js";
import {Mute} from "../commands/autoMod/userBlock/Mute";
import {UsernameModel} from "../model/DB/autoMod/impl/Username.model";
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {BaseDAO, UniqueViolationError} from "../DAO/BaseDAO";

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
        let allModels = await UsernameModel.findAll();
        let guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        let pArr = allModels.map(model => {
            return guild.members.fetch(model.userId).then(member => {
                return member.setNickname(model.usernameToPersist);
            }).then(member => {
                console.log(`Set username for "${member.user.username}" to "${model.usernameToPersist}"`);
            });
        });
        await Promise.all(pArr);
        console.log("set all Usernames");
    }

    private static async initiateMuteTimers(): Promise<void> {
        let mutesWithTimers = await MuteModel.findAll({
            where: {
                timeout: {
                    [Op.not]: null
                }
            }
        });
        let now = Date.now();
        for (let mute of mutesWithTimers) {
            let muteCreated = (mute.createdAt as Date).getTime();
            let timerLength = mute.timeout;
            let timeLeft = timerLength - (now - muteCreated);
            let guild: Guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
            if (timeLeft <= 0) {
                console.log(`Timer has expired for user ${mute.username}, removing from database`);
                await MuteModel.destroy({
                    where: {
                        id: mute.id
                    }
                });
            } else {
                console.log(`Re-creating timed mute for ${mute.username}, time reamining is: ${ObjectUtil.secondsToHuman(Math.round(timeLeft / 1000))}`);
                Mute.createTimeout(mute.userId, mute.username, timeLeft, guild);
            }
        }
    }

    private async populateClosableEvents(): Promise<void> {
        let allModules = Main.closeableModules;
        for (let module of allModules) {
            let moduleId = module.moduleId;
            let exists = await CloseOptionModel.findOne({
                where: {
                    moduleId
                }
            });
            if (!exists) {
                let m = new CloseOptionModel({
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