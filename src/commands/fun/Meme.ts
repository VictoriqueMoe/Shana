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
import {container} from "tsyringe";

@Discord()
export abstract class Meme extends AbstractCommandModule<any> {

    private handler = container.resolve(ImageFun);

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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "name": "pornhub",
                        "isSlash": false,
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "Text to use",
                                    "type": "text",
                                    "optional": false,
                                    "description": "The text to use on the pornhub page"
                                }
                            ]
                        }
                    },
                    {
                        "name": "steamcard",
                        "isSlash": false,
                        "description": {
                            "args": [
                                {
                                    "name": "Image",
                                    "type": "attachment",
                                    "optional": true,
                                    "description": "The image to use for this meme (keep blank to refer to yourself)"
                                },
                                {
                                    "name": "Text to use",
                                    "type": "text",
                                    "optional": false,
                                    "description": "The text to use on the steamcard"
                                }
                            ]
                        }
                    },
                    {
                        "name": "symmetry",
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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
                        "isSlash": false,
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

    @SimpleCommand("waifu", {
        aliases: EnumEx.getNames(GENERATE_ENDPOINT)
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
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg', size: 1024});
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
            result = await this.handler.generate(request);
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
