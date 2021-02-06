import {Command, CommandMessage, Guard} from "@typeit/discord";
import {Roles} from "../enums/Roles";
import {AdminOnlyTask} from "../guards/AdminOnlyTask";
import {TagModel} from "../dao/Tag.model";

export class Test {

    @Command("test")
    @Guard(AdminOnlyTask)
    private test(command: CommandMessage): void {
        let tag = new TagModel({
            "name": 'bob',
            "description": "This is a description",
            "username": "VictoriqueMoe",
            "usage_count" : 4
        });
        tag.set({
            "name": 'bobChanged',
            "description": "This is a description",
            "username": "VictoriqueMoe",
            "usage_count" : 4
        });
        debugger;
    }
}