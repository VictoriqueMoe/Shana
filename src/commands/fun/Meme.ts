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
import {DefaultPermissionResolver, Discord, Guard, Permission, SimpleCommand, SimpleCommandMessage} from "discordx";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {injectable} from "tsyringe";
import {Category} from "@discordx/utilities";

@Discord()
@Category("Memes", "Commands generate memes. All commands that are marked as type 'attachment' can take both an uploaded image (has to be jpg) OR a mention")
@Category("Memes", [
    {
        "name": "3000years",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "approved",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "afusion",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "User",
                "description": "the 2nd image to use",
                "optional": false,
                "type": "USER"
            }
        ]
    },
    {
        "name": "batslap",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "User",
                "description": "the member to slap",
                "optional": false,
                "type": "USER"
            }
        ]
    },
    {
        "name": "beautiful",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "blur",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "blur amount",
                "description": "The amount of blue to apply (defaults to 5) MAX: 30",
                "optional": true,
                "type": "NUMBER"
            },
            {
                "name": "delete message",
                "description": "if true, the bot will delete the message you send automatically",
                "optional": true,
                "type": "BOOLEAN"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "blurple",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "invert",
                "description": "invert the iamge",
                "optional": true,
                "type": "BOOLEAN"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "brazzers",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "burn",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "challenger",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "circle",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "contrast",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "crush",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "facebook",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "text of post",
                "description": "Text of the facebook post",
                "optional": true,
                "type": "STRING"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "ddungeon",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "deepfry",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "dictator",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "distort",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "dither565",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "emboss",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "fire",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "frame",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "gay",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "glitch",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "greyple",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "invert",
                "description": "invert the iamge",
                "optional": true,
                "type": "BOOLEAN"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "greyscale",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "instagram",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "invert",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "jail",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "lookwhatkarenhave",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "Magik",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "missionpassed",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "moustache",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "pixelize",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "pixelation amount",
                "description": "The amount of pixels to use, smaller = more pixelated (between 1 and 50)",
                "optional": true,
                "type": "NUMBER"
            },
            {
                "name": "delete message",
                "description": "if true, the bot will delete the message you send automatically",
                "optional": true,
                "type": "BOOLEAN"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "ps4",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "posterize",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "rejected",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "redple",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "rip",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "scary",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "sepia",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "sharpen",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "sniper",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "pornhub",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "Text to use",
                "description": "The text to use on the pornhub page",
                "optional": false,
                "type": "STRING"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "steamcard",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "Text to use",
                "description": "The text to use on the steamcard",
                "optional": false,
                "type": "STRING"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "symmetry",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "thanos",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "trinity",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "tobecontinued",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "subzero",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "triggered",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "invert",
                "description": "invert the iamge",
                "optional": true,
                "type": "BOOLEAN"
            }
        ],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "unsharpen",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "utatoo",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "vs",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "User",
                "description": "the member to vs",
                "optional": false,
                "type": "USER"
            }
        ]
    },
    {
        "name": "wanted",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "wasted",
        "type": "SIMPLECOMMAND",
        "options": [],
        "attachments": [
            {
                "name": "Image",
                "description": "The image to use for this meme (keep blank to refer to yourself)",
                "optional": true,
                "type": "ATTACHMENT",
                "extensions": [
                    "jpg",
                    "png"
                ]
            }
        ]
    },
    {
        "name": "whowouldwin",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "User",
                "description": "opponent",
                "optional": false,
                "type": "USER"
            }
        ]
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class Meme extends AbstractCommandModule {

    public constructor(private _handler: ImageFun) {
        super();
    }

    @SimpleCommand("Memes", {
        aliases: EnumEx.getNames(GENERATE_ENDPOINT)
    })
    @Guard(CommandEnabled)
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
