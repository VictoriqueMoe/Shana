import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {Category} from "@discordx/utilities";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {AutocompleteInteraction, CommandInteraction, MessageEmbed} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {container, injectable} from "tsyringe";
import {Covid19DataManager} from "../../model/rapidApi/Covid19DataManager";
import {getFlagUrl} from "../../model/Impl/FlagApi";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("rapid_api", "Commands to interact with various endpoints")
@Category("rapid_api", [])
@SlashGroup({
    name: "rapid_api",
    description: "Commands to interact with various endpoints",
})
@SlashGroup({
    name: "covid",
    description: "get covid info for countries and world data",
    root: "rapid_api"
})
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class RapidAPI extends AbstractCommandModule {

    public constructor(private _covid19DataManager: Covid19DataManager) {
        super();
    }

    @Slash("covid_by_country", {
        description: "Get covid status by a country name"
    })
    @SlashGroup("covid", "rapid_api")
    @Guard(NotBotInteraction, CommandEnabled(container.resolve(Covid19DataManager)))
    private async covidByCountry(
        @SlashOption("country", {
            description: "the name of the country to lookup",
            type: 'STRING',
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, container.resolve(Covid19DataManager))
        })
            countryName: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const response = (await this._covid19DataManager.getLatestCountryDataByName(countryName))[0];
        if (!ObjectUtil.isValidObject(response)) {
            return InteractionUtils.replyOrFollowUp(interaction, `Unable to find data for country ${countryName}`);
        }
        const flagUrl = getFlagUrl(response.code.toLowerCase());
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`COVID-19 data for ${countryName}`)
            .setFields([
                {
                    name: "country",
                    value: response.country,
                    inline: true
                },
                {
                    name: "code",
                    value: response.code,
                    inline: true
                },
                {
                    name: "confirmed",
                    value: response.confirmed.toLocaleString(),
                    inline: true
                },
                {
                    name: "recovered",
                    value: response.recovered.toLocaleString(),
                    inline: true
                },
                {
                    name: "critical",
                    value: response.critical.toLocaleString(),
                    inline: true
                },
                {
                    name: "deaths",
                    value: response.deaths.toLocaleString(),
                    inline: true
                }
            ])
            .setThumbnail(flagUrl)
            .setTimestamp();
        interaction.editReply({
            embeds: [embed]
        });
    }
}
