import {ImageFun} from "../../model/Impl/ImageFun/ImageFun";
import {DiscordUtils, EnumEx, ObjectUtil, StringUtils} from "../../utils/Utils";
import {
    additionalGenGetArgs,
    GENERATE_ENDPOINT,
    GenerateEndPointRequest,
    GenerateEndPointResponse
} from "../../model/Impl/ImageFun/Typeings";
import {AssertionError} from "assert";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {Discord, Guard, SimpleCommand, SimpleCommandMessage} from "discordx";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {injectable} from "tsyringe";
import {Category} from "@discordx/utilities";

@Discord()
@Category("Meme", "Commands generate memes. All commands that are marked as type 'attachment' can take both an uploaded image (has to be jpg) OR a mention")
@Category("Meme", [
    {
        name: "viewUsernames",
        description: "View all the persisted usernames this bot is aware of",
        type: "SLASH",
        options: []
    },
    {
        name: "username",
        description: "force a username to always be set to a member, this will automatically apply the username if they leave and rejoin again. \n you can optionally add a block to anyone other than staff member from changing it",
        type: "SLASH",
        options: [
            {
                name: "Channel",
                type: "USER",
                optional: false,
                description: "The user you want to change nicknames"
            },
            {
                name: "new nickName",
                type: "STRING",
                optional: false,
                description: "The new nickname for the user"
            },
            {
                name: "Block changes",
                type: "BOOLEAN",
                optional: true,
                description: "Block this username from being changed by another other than staff members (as defined in the staff members config)"
            }
        ]
    }
])
@injectable()
export class Meme extends AbstractCommandModule {

    public constructor(private _handler: ImageFun) {
        super();
    }

    @SimpleCommand("waifu", {
        aliases: EnumEx.getNames(GENERATE_ENDPOINT).filter(r => r !== "waifu")
    })
    @Guard(secureCommandInteraction)
    private async generate(command: SimpleCommandMessage): Promise<void> {
        const {message} = command;
        const endPoint = command.name;
        const enumObj = GENERATE_ENDPOINT[endPoint];
        if (!ObjectUtil.validString(enumObj)) {
            return;
        }
        const member = message.member;
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg', size: 1024, dynamic: true});
        const request: GenerateEndPointRequest = {
            "endPoint": enumObj,
            "Body_Params": {
                "url": avatarUrl
            }
        };
        const avatarOverride = Meme.getMentionAvatar(command);
        let canOverride = true;
        const argumentArray = StringUtils.splitCommandLine(message.content);
        try {
            request["Body_Params"]["additional"] = this.parseArguments(enumObj, argumentArray, command);
            canOverride = false;
        } catch (e) {
            if (e instanceof AssertionError) {
                message.reply(e.message);
                return;
            }
        }
        const urls = await DiscordUtils.getImageUrlsFromMessageOrReference(message);
        if (urls.size === 1) {
            const url = urls.values().next().value;
            avatarOverride["avatar"] = url;
            canOverride = true;
        }
        if (canOverride && ObjectUtil.isValidObject(avatarOverride)) {
            request["Body_Params"]["url"] = avatarOverride["avatar"];
        }
        // for some reason, batslap switches "avatar" and "url"
        if (endPoint === GENERATE_ENDPOINT.batslap) {
            const ob = request["Body_Params"]["additional"] as additionalGenGetArgs["batslap"];
            const targetUrl = request.Body_Params.url;
            const myUrl = ob.avatar;
            const newOb: additionalGenGetArgs["batslap"] = {
                "avatar": targetUrl
            };
            request.Body_Params.url = myUrl;
            (request["Body_Params"]["additional"] as additionalGenGetArgs["batslap"]) = newOb;
        }
        let result: GenerateEndPointResponse = null;
        try {
            result = await this._handler.generate(request);
        } catch (e) {
            console.error(e);
            message.reply("An error has occured, this has been logged");
            return;
        }
        let fileName = `${ObjectUtil.guid()}`;
        fileName = endPoint === GENERATE_ENDPOINT.triggered ? `${fileName}.gif` : `${fileName}.jpg`;
        message.channel.send({
            files: [{
                attachment: result,
                name: fileName
            }]
        });
        if (endPoint === GENERATE_ENDPOINT.blur || endPoint === GENERATE_ENDPOINT.pixelize) {
            if (argumentArray[1] === "true") {
                message.delete();
            }
        }
    }

    private parseArguments(endPoint: GENERATE_ENDPOINT, args: string[], commandMessage: SimpleCommandMessage): additionalGenGetArgs {
        const replyObj: additionalGenGetArgs = {};
        switch (endPoint) {
            case GENERATE_ENDPOINT.twitter: {
                const {avatar1, avatar2, avatar3} = Meme.getMentionAvatar(commandMessage, 3);
                const text = args[3];
                if (!ObjectUtil.validString(text)) {
                    throw new AssertionError({
                        message: `Please supply some text as the last argument`
                    });
                }
                replyObj["twitter"] = {
                    avatar1,
                    avatar2,
                    avatar3,
                    text
                };
                break;
            }
            case GENERATE_ENDPOINT.blur: {
                let value = args[0];
                if (!ObjectUtil.validString(value)) {
                    value = "5";
                }
                const blur = Number.parseInt(value);
                if (Number.isNaN(blur)) {
                    throw new AssertionError({
                        message: `Please ensure blur amount is a number`
                    });
                }
                if (blur < 1 || blur > 30) {
                    throw new AssertionError({
                        message: `Blur amount must be between 1 and 30`
                    });
                }
                replyObj["blur"] = {
                    blur
                };
                break;
            }
            case GENERATE_ENDPOINT.blurple:
            case GENERATE_ENDPOINT.redple:
            case GENERATE_ENDPOINT.triggered:
            case GENERATE_ENDPOINT.greyple: {
                const arg = args[0];
                const invert = arg === "true";
                replyObj[endPoint] = {
                    invert
                };
                break;
            }
            case GENERATE_ENDPOINT.pixelize: {
                let value = args[0];
                if (!ObjectUtil.validString(value)) {
                    value = "5";
                }
                const pixelize = Number.parseInt(value);
                if (Number.isNaN(pixelize)) {
                    throw new AssertionError({
                        message: `Please ensure pixel Size amount is a number`
                    });
                }
                if (pixelize < 1 || pixelize > 50) {
                    throw new AssertionError({
                        message: `pixel Size amount must be between 1 and 50`
                    });
                }
                replyObj["pixelize"] = {
                    pixelize
                };
                break;
            }
            case GENERATE_ENDPOINT.trinity:
                replyObj["trinity"] = {
                    type: "2"
                };
                break;
            case GENERATE_ENDPOINT.symmetry:
                replyObj["symmetry"] = {
                    orientation: "left-right"
                };
                break;
            case GENERATE_ENDPOINT.vs: {
                const otherAvatarObj = Meme.getMentionAvatar(commandMessage, 1);
                replyObj["vs"] = {
                    "type": 3,
                    "avatar": otherAvatarObj["avatar"]
                };
                break;
            }
            case GENERATE_ENDPOINT.whowouldwin:
            case GENERATE_ENDPOINT.afusion:
            case GENERATE_ENDPOINT.batslap: {
                Meme.populateAvatar(replyObj, commandMessage, 1);
                break;
            }
            case GENERATE_ENDPOINT.steamcard:
            case GENERATE_ENDPOINT.pornhub:
            case GENERATE_ENDPOINT.facebook: {
                const text = args[0];
                if (!ObjectUtil.validString(text)) {
                    throw new AssertionError({
                        message: `Please supply some text`
                    });
                }
                replyObj[endPoint] = {
                    text
                };
                break;
            }
            default:
                throw new Error("Endpoint not supported");
        }
        return replyObj;
    }

    private static populateAvatar(obj: Record<string, unknown>, command: SimpleCommandMessage, expectedMentions?: number): void {
        const avatarObj = Meme.getMentionAvatar(command, expectedMentions);
        for (const prop in avatarObj) {
            if (avatarObj.hasOwnProperty(prop)) {
                obj[prop] = avatarObj[prop];
            }
        }
    }

    private static getMentionAvatar(command: SimpleCommandMessage, expectedMentions?: number): avatarArr {
        const {message} = command;
        const mentions = message.mentions;
        const membersCollection = mentions.members;
        const members = [...membersCollection.values()];
        if (typeof expectedMentions === "number" && members.length != expectedMentions) {
            throw new AssertionError({
                message: `Please ensure you mention exactly ${expectedMentions} members`
            });
        }
        const returnObj: avatarArr = {};
        if (members.length === 1) {
            returnObj[`avatar`] = members[0].user.displayAvatarURL({format: 'jpg', size: 1024, dynamic: true});
        } else {
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                returnObj[`avatar${i + 1}`] = member.user.displayAvatarURL({format: 'jpg', size: 1024, dynamic: true});
            }
        }
        return returnObj;
    }
}

type avatarArr = {
    [key: string]: string
}
