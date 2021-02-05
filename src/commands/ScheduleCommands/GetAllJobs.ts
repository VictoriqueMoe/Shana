import {Command, CommandMessage, Guard} from "@typeit/discord";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {MessageScheduler} from "../../model/MessageScheduler";

export abstract class GetAllJobs {

    @Command("getAllScheduledMessages")
    @Guard(AdminOnlyTask)
    private getAllScheduledMessages(command: CommandMessage): void {
        let allJobs = MessageScheduler.getInstance().jobs;
        if (allJobs.length === 0) {
            command.reply("There are no pending scheduled messages");
            return;
        }
        let str = `there are ${allJobs.length} scheduled posts active \n` + allJobs.map(job => {
            let channelThisJobBelongsTo = job.channel;
            let nameOfJob = job.name;
            return `${nameOfJob} posts to "<#${channelThisJobBelongsTo.id}>"`;
        }).join("\n");
        command.reply(str);
    }
}