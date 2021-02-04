import {ArgsOf, Client, On} from "@typeit/discord";

export abstract class OnGuildMemberUpdate {
    @On("guildMemberUpdate")
    private onMemberUpdate(
        [oldUser, newUser]: ArgsOf<"guildMemberUpdate">,
        client: Client
    ): void {
        let isNickChange = oldUser.nickname !== newUser.nickname;
        if (isNickChange) {
            if (newUser.id === "697417252320051291") {
                newUser.setNickname("Mistress Victorique").catch(() => {
                });
            }
        }
    }
}