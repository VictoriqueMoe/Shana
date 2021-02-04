import {On} from "@typeit/discord";
import {Main} from "../Main";

export abstract class OnReady{
    @On("ready")
    initialize(): void {
        console.log("Bot logged in.");
        Main.Client.user.setActivity('Anime', { type: 'WATCHING' });
    }
}