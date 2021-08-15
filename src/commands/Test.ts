import {ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton,} from "discord.js";
import {ButtonComponent, Discord, Slash} from "discordx";

@Discord()
class Test {
    @Slash("hello")
    async hello(interaction: CommandInteraction) {
        await interaction.deferReply();

        // Create the button, giving it the ID: "hello-btn"
        const helloBtn = new MessageButton()
            .setLabel("Hello")
            .setEmoji("👋")
            .setStyle("PRIMARY")
            .setCustomId("hello-btn");

        // Create a MessageActionRow and add the button to that row.
        const row = new MessageActionRow().addComponents(helloBtn);

        interaction.editReply({
            content: "Say hello to bot",
            components: [row],
        });
    }

    // register a handler for the button with ID: "hello-btn"
    @ButtonComponent("hello-btn")
    mybtn(interaction: ButtonInteraction) {
        interaction.reply(`👋 ${interaction.member}`);
    }
}