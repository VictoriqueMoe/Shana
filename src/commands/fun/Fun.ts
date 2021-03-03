import {ImageFun} from "../../model/Impl/ImageFun/ImageFun";
import {Command, CommandMessage, Guard, Rules} from "@typeit/discord";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {NotBot} from "../../guards/NotABot";
import {ObjectUtil, StringUtils} from "../../utils/Utils";
import {
    additionalGenGetArgs,
    GENERATE_ENDPOINT,
    GenerateEndPointRequest,
    GenerateEndPointResponse
} from "../../model/Impl/ImageFun/Typeings";
import {AssertionError} from "assert";

const {prefix} = require('../../../config.json');

export abstract class Fun {
    private handler = ImageFun.instance;

    @Command("generateEndpoints")
    @Guard(AdminOnlyTask)
    private async generateEndpoints(command: CommandMessage): Promise<void> {
        const resp = await this.handler.getEndpointsGenerate();
        const formatted = JSON.stringify(resp, null, 4);
        command.reply(formatted, {
            "code": "JSON"
        });
    }

    @Command()
    @Rules(".*")
    @Guard(NotBot)
    private async generate(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        let endPoint = command.commandContent.replace(prefix, "");
        endPoint = endPoint.split(" ").shift();
        const enumObj = GENERATE_ENDPOINT[endPoint];
        if (!ObjectUtil.validString(enumObj)) {
            return;
        }
        const avatarUrl = command.member.user.displayAvatarURL({format: 'jpg'});
        const request: GenerateEndPointRequest = {
            "endPoint": enumObj,
            "Body_Params": {
                "url": avatarUrl
            }
        };
        const avatarOverride = this.getMentionAvatar(command);
        let canOverride = true;
        try {
            request["Body_Params"]["additional"] = this.parseArguments(enumObj, argumentArray, command);
            canOverride = false;
        } catch (e) {
            if (e instanceof AssertionError) {
                command.reply(e.message);
                return;
            }
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
            result = await this.handler.generate(request);
        } catch (e) {
            console.error(e);
            command.reply("An error has occured, this has been logged");
            return;
        }
        command.channel.send("", {
            files: [{
                attachment: result
            }]
        });
    }

    private parseArguments(endPoint: GENERATE_ENDPOINT, args: string[], message: CommandMessage): additionalGenGetArgs {
        const replyObj: additionalGenGetArgs = {};
        switch (endPoint) {
            case GENERATE_ENDPOINT.twitter:
                break;
            case GENERATE_ENDPOINT.blur:
                break;
            case GENERATE_ENDPOINT.blurple:
            case GENERATE_ENDPOINT.redple:
            case GENERATE_ENDPOINT.greyple:
                break;
            case GENERATE_ENDPOINT.pixelize:
                break;
            case GENERATE_ENDPOINT.trinity:
                break;
            case GENERATE_ENDPOINT.symmetry:
                break;
            case GENERATE_ENDPOINT.vs: {
                const otherAvatarObj = this.getMentionAvatar(message, 1);
                replyObj["vs"] = {
                    "type": 3,
                    "avatar": otherAvatarObj["avatar"]
                };
                break;
            }
            case GENERATE_ENDPOINT.whowouldwin:
            case GENERATE_ENDPOINT.afusion:
            case GENERATE_ENDPOINT.batslap: {
                this.populateAvatar(replyObj, message, 1);
                break;
            }
            case GENERATE_ENDPOINT.steamcard:
            case GENERATE_ENDPOINT.facebook:
                break;
            case GENERATE_ENDPOINT.triggered:
                break;
            default:
                throw new Error("Endpoint not supported");
        }
        return replyObj;
    }

    private populateAvatar(obj: Record<string, unknown>, CommandMessage, expectedMentions?: number): void {
        const avatarObj = this.getMentionAvatar(CommandMessage, expectedMentions);
        for (const prop in avatarObj) {
            if (avatarObj.hasOwnProperty(prop)) {
                obj[prop] = avatarObj[prop];
            }
        }
    }

    private getMentionAvatar(command: CommandMessage, expectedMentions?: number): avatarArr {
        const mesntions = command.mentions;
        const membersCollection = mesntions.members;
        const members = membersCollection.array();
        if (typeof expectedMentions === "number" && members.length != expectedMentions) {
            throw new AssertionError({
                message: `Please ensure you mention exactly ${expectedMentions} members`
            });
        }
        const returnObj: avatarArr = {};
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            const url = member.user.displayAvatarURL({format: 'jpg'});
            if (i === 0) {
                returnObj[`avatar`] = url;
            } else {
                returnObj[`avatar${i}`] = url;
            }
        }
        return returnObj;
    }
}

type avatarArr = {
    [key: string]: string
}
