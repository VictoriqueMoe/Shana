import {ImageFun} from "../../model/Impl/ImageFun/ImageFun";
import {Client, Command, CommandMessage, Guard, Rules} from "@typeit/discord";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {NotBot} from "../../guards/NotABot";
import {ObjectUtil, StringUtils} from "../../utils/Utils";
import {
    additionalGenGetArgs,
    GENERATE_ENDPOINT,
    GenerateEndPointRequest,
    GenerateEndPointResponse
} from "../../model/Impl/ImageFun/Typeings";
import {Message} from "discord.js";
import {AssertionError} from "assert";

const {prefix} = require('../../../config.json');

// The command name will be yo if the message is "hello"
async function commandName(message: Message, client: Client) {
    if (message.content === "hello") {
        return "yo";
    }
    return "hello";
}

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
                return;
            }
        }
        if (canOverride && avatarOverride.length == 1) {
            request["Body_Params"]["url"] = avatarOverride[0];
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
            case GENERATE_ENDPOINT.vs: {
                if (args.length !== 1) {
                    throw new AssertionError({
                        message: "Invalid arguments for this command, please supply: <userToVs>"
                    });
                }
                const otherAvatar = this.getMentionAvatar(message);
                if (otherAvatar.length !== 1) {
                    throw new AssertionError({
                        message: "Please mention a member"
                    });
                }
                const option: additionalGenGetArgs["vs"] = {
                    "type": 3,
                    "avatar": otherAvatar[0]
                };
                replyObj["vs"] = option;
                break;
            }
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
            case GENERATE_ENDPOINT.whowouldwin:
            case GENERATE_ENDPOINT.afusion:
            case GENERATE_ENDPOINT.batslap:
                break;
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

    private getMentionAvatar(command: CommandMessage): string[] {
        const mesntions = command.mentions;
        const members = mesntions.members;
        if (members.size === 0) {
            return [];
        }
        return members.map(value => value.user.displayAvatarURL({format: 'jpg'}));
    }
}

