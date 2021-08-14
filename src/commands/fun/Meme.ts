import {ImageFun} from "../../model/Impl/ImageFun/ImageFun";
import {Command, CommandMessage, Guard, Rules} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {
    additionalGenGetArgs,
    GENERATE_ENDPOINT,
    GenerateEndPointRequest,
    GenerateEndPointResponse
} from "../../model/Impl/ImageFun/Typeings";
import {AssertionError} from "assert";
import {secureCommand} from "../../guards/RoleConstraint";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {getPrefix} from "../../Main";

export abstract class Meme extends AbstractCommandModule<any> {

    private handler = ImageFun.instance;

    constructor() {
        super(
            {
                module: {
                    name: "Memes",
                    description: "Commands generate memes. All commands that are marked as type 'attachment' can take both an uploaded image (has to be jpg) OR a mention"
                },
                "commands": [
                    {
                        "name": "3000years",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "approved",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "afusion",
                        "description": {
                            "args": [
                                {
                                    "name": "User",
                                    "type": "mention",
                                    "optional": false,
                                    "description": "the 2nd image to use"
                                }
                            ]
                        }
                    },
                    {
                        "name": "batslap",
                        "description": {
                            "args": [
                                {
                                    "name": "User",
                                    "type": "mention",
                                    "optional": false,
                                    "description": "the member to slap"
                                }
                            ]
                        }
                    },
                    {
                        "name": "beautiful",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "blur",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "blur amount",
                                    "type": "number",
                                    "optional": true,
                                    "description": "The amount of blue to apply (defaults to 5) MAX: 30"
                                },
                                {
                                    "name": "delete message",
                                    "type": "boolean",
                                    "optional": true,
                                    "description": "if true, the bot will delete the message you send automatically"
                                }
                            ]
                        }
                    },
                    {
                        "name": "blurple",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "invert",
                                    "type": "boolean",
                                    "optional": true,
                                    "description": "invert the iamge"
                                }
                            ]
                        }
                    },
                    {
                        "name": "brazzers",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "burn",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "challenger",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "circle",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "contrast",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "crush",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "facebook",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "text of post",
                                    "type": "text",
                                    "optional": true,
                                    "description": "Text of the facebook post"
                                }
                            ]
                        }
                    },
                    {
                        "name": "ddungeon",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "deepfry",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "dictator",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "distort",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "dither565",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "emboss",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "fire",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "frame",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "gay",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "glitch",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "greyple",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "invert",
                                    "type": "boolean",
                                    "optional": true,
                                    "description": "invert the iamge"
                                }
                            ]
                        }
                    },
                    {
                        "name": "greyscale",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "instagram",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "invert",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "jail",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "lookwhatkarenhave",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "Magik",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "missionpassed",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "moustache",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "pixelize",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "pixelation amount",
                                    "type": "number",
                                    "optional": true,
                                    "description": "The amount of pixels to use, smaller = more pixelated (between 1 and 50)"
                                },
                                {
                                    "name": "delete message",
                                    "type": "boolean",
                                    "optional": true,
                                    "description": "if true, the bot will delete the message you send automatically"
                                }
                            ]
                        }
                    },
                    {
                        "name": "ps4",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "posterize",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "rejected",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "redple",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "rip",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "scary",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "sepia",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "sharpen",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "sniper",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "steamcard",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    name: "Text to use",
                                    type: "text",
                                    optional: false,
                                    description: "The text to use on the steamcard"
                                }
                            ]
                        }
                    },
                    {
                        "name": "symmetry",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "thanos",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "trinity",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "tobecontinued",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "subzero",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "triggered",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "invert",
                                    "type": "boolean",
                                    "optional": true,
                                    "description": "invert the iamge"
                                }
                            ]
                        }
                    },
                    {
                        "name": "unsharpen",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "utatoo",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "vs",
                        "description": {
                            "args": [
                                {
                                    "name": "User",
                                    "type": "mention",
                                    "optional": false,
                                    "description": "the member to vs"
                                }
                            ]
                        }
                    },
                    {
                        "name": "wanted",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "wasted",
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                }
                            ]
                        }
                    },
                    {
                        "name": "whowouldwin",
                        "description": {
                            "args": [
                                {
                                    "name": "User",
                                    "type": "mention",
                                    "optional": false,
                                    "description": "opponent"
                                }
                            ]
                        }
                    }
                ]
            }
        );
    }

    @Command("generateEndpoints")
    @Guard(secureCommand)
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
        const prefix = await getPrefix(command.guild.id);
        let endPoint = command.commandContent.replace(prefix, "");
        endPoint = endPoint.split(" ").shift();
        const enumObj = GENERATE_ENDPOINT[endPoint];
        if (!ObjectUtil.validString(enumObj)) {
            return;
        }
        const avatarUrl = command.member.user.displayAvatarURL({format: 'jpg', size: 1024});
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
        const urls = await DiscordUtils.getImageUrlsFromMessageOrReference(command);
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
            result = await this.handler.generate(request);
        } catch (e) {
            console.error(e);
            command.reply("An error has occured, this has been logged");
            return;
        }
        let fileName = `${ObjectUtil.guid()}`;
        fileName = endPoint === GENERATE_ENDPOINT.triggered ? `${fileName}.gif` : `${fileName}.jpg`;
        command.channel.send("", {
            files: [{
                attachment: result,
                name: fileName
            }]
        });
        if (endPoint === GENERATE_ENDPOINT.blur || endPoint === GENERATE_ENDPOINT.pixelize) {
            if (argumentArray[1] === "true") {
                command.delete();
            }
        }
    }

    private parseArguments(endPoint: GENERATE_ENDPOINT, args: string[], message: CommandMessage): additionalGenGetArgs {
        const replyObj: additionalGenGetArgs = {};
        switch (endPoint) {
            case GENERATE_ENDPOINT.twitter: {
                const {avatar1, avatar2, avatar3} = this.getMentionAvatar(message, 3);
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
        if (members.length === 1) {
            returnObj[`avatar`] = members[0].user.displayAvatarURL({format: 'jpg', size: 1024});
        } else {
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                returnObj[`avatar${i + 1}`] = member.user.displayAvatarURL({format: 'jpg', size: 1024});
            }
        }
        return returnObj;
    }
}

type avatarArr = {
    [key: string]: string
}
