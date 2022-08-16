import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import {GuildableModel} from "../../DB/entities/guild/Guildable.model.js";
import {Client} from "discordx";
import logger from "../../../utils/LoggerFactory.js";
import {singleton} from "tsyringe";
import type {GuildMember} from "discord.js";
import {UsernameModel} from "../../DB/entities/autoMod/impl/Username.model.js";
import {DbUtils} from "../../../utils/Utils.js";
import {DeleteResult} from "typeorm";

@singleton()
export class UsernameManager extends DataSourceAware {


    public getUsername(member: GuildMember): Promise<UsernameModel | null> {
        return this.ds.getRepository(UsernameModel).findOne({
            where: {
                userId: member.id,
                guildId: member.guild.id
            }
        });
    }

    public async removeNickname(member: GuildMember): Promise<DeleteResult> {
        return this.ds.getRepository(UsernameModel).delete({
            userId: member.id,
            guildId: member.guild.id
        });
    }

    public async setUsername(member: GuildMember, username: string, force): Promise<UsernameModel> {
        const guildId = member.guild.id;
        const userId = member.id;
        const repo = this.ds.getRepository(UsernameModel);
        let modelToSave: UsernameModel;
        const existingObject = await repo.findOne({
            where: {
                guildId,
                userId
            }
        });
        if (existingObject) {
            existingObject.force = force;
            existingObject.usernameToPersist = username;
            modelToSave = existingObject;
        } else {
            const obj = {
                userId,
                username,
                force,
                guildId
            };
            modelToSave = DbUtils.build(UsernameModel, obj);
        }
        return repo.save(modelToSave);
    }

    public getAllUsernames(guildId: string): Promise<UsernameModel[]> {
        return this.ds.manager.find(UsernameModel, {
            where: {
                guildId
            }
        });
    }

    @PostConstruct
    public async init(client: Client): Promise<void> {
        const allModels = await this.ds.getRepository(GuildableModel).find({
            relations: ["usernameModel"]
        });
        const pArr: Promise<void>[] = [];
        for (const model of allModels) {
            const guild = await client.guilds.fetch(model.guildId);
            const userNameModels = model.usernameModel;
            const innerPromiseArray = userNameModels.map(userNameModel => {
                return guild.members.fetch(userNameModel.userId).then(member => {
                    return member.setNickname(userNameModel.usernameToPersist);
                }).then(member => {
                    logger.info(`Set username for "${member.user.username}" to "${userNameModel.usernameToPersist}"`);
                }).catch(() => {
                    logger.info(`Unable to set username for user ${userNameModel.userId} as they no longer exist in this guild`);
                });
            });
            pArr.push(...innerPromiseArray);
        }
        await Promise.all(pArr);
        logger.info("set all Usernames");
    }

}
