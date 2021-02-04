import {On} from "@typeit/discord";
import {Main} from "../Main";

export abstract class OnReady{
    @On("ready")
    initialize(): void {
        console.log("Bot logged in.");
        Main.client.user.setActivity('Anime', { type: 'WATCHING' });
    }
}