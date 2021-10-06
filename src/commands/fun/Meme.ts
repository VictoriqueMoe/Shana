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

@Discord()
export class Meme extends AbstractCommandModule<any> {
    public constructor(private _handler: ImageFun) {
        super(
            {
                module: {
                    name: "Memes",
                    description: "Commands generate memes. All commands that are marked as type 'attachment' can take both an uploaded image (has to be jpg) OR a mention"
                },
                "commands": [
                    {
                        "name": "3000years",
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
                        type: "command",
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
