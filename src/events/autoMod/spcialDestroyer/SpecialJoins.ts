import {ArgsOf, Client, On} from "@typeit/discord";
import {SpecialKickModel} from "../../../model/DB/autoMod/specialDestoryer/specialKick.model";
import {Channels} from "../../../enums/Channels";
import {TextChannel} from "discord.js";
import {Roles} from "../../../enums/Roles";
import RolesEnum = Roles.RolesEnum;

export abstract class SpecialJoins {

    @On("guildMemberAdd")
    private async specialJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        // member joins, check DB if they left as a special
        let userId = member.user.id;
        let kickResult = await SpecialKickModel.findOne({ // OOPS
            where: {
                userId
            }
        });
        if (kickResult) {
            // member has been found (they rejoined)
            let testChannel = client.channels.cache.get(Channels.LOG_CHANNEL) as TextChannel;
            //TODO: WHO TO PING!? ping just me for now. maybe have opt in
            await testChannel.send(`Member <@${member.user.id}> has rejoined after leaving as special (possible special evasion) \n <@697417252320051291> <@593208170869162031>`);
            member.roles.add(RolesEnum.SPECIAL);// for testing. but this will be special role... Dyno will auto add headcrab after 1 min, need to add a listener to role add too.
        }
    }
}