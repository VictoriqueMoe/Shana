import {Client, On} from "@typeit/discord";
import {Main} from "../Main";
import {Sequelize} from "sequelize-typescript";
import {WeebBot} from "../discord/WeebBot";
import {VicDropbox} from "../model/dropbox/VicDropbox";
import {MuteModel} from "../model/DB/autoMod/Mute.model";
import {Op} from "sequelize";
import {AddMuteLock} from "../commands/autoMod/userBlock/AddMuteLock";
import {ObjectUtil} from "../utils/Utils";
import {Guild, User} from "discord.js";


export abstract class OnReady {

    private static _dao: Sequelize;

    @On("ready")
    private async initialize(): Promise<void> {
        OnReady._dao = new Sequelize('database', 'username', 'password', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: false,
            storage: 'database.sqlite',
            models: [__dirname + '/../model/DB/**/*.model.ts'],
            modelMatch: (filename, member) => {
                return `${filename.substring(0, filename.indexOf('.model'))}Model`.toLowerCase() === member.toLowerCase();
            }
        });
        await Main.client.user.setActivity('Anime', {type: 'WATCHING'});
        await OnReady._dao.sync({force: false});
        await VicDropbox.instance.index();
        await OnReady.initiateMuteTimers();
        console.log("Bot logged in.");
    }

    public static get dao(): Sequelize {
        return OnReady._dao;
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
            let guilds = Main.client.guilds;
            let blockedUser: User = null;
            let guild: Guild = null;
            for (let [, _guild] of guilds.cache) {
                let localBlockedUser = (await _guild.members.fetch(mute.userId)).user;
                if (localBlockedUser != null) {
                    blockedUser = localBlockedUser;
                    guild = _guild;
                    break;
                }
            }
            if (timeLeft <= 0) {
                console.log(`Timer has expired for user ${blockedUser.username}, removing from database`);
                await MuteModel.destroy({
                    where: {
                        id: mute.id
                    }
                });
            } else {
                console.log(`Re-creating timed mute for ${blockedUser.username}, time reamining is: ${ObjectUtil.secondsToHuman(Math.round(timeLeft / 1000))}`);
                AddMuteLock.createTimeout(blockedUser, timeLeft, guild);
            }
        }
    }
}