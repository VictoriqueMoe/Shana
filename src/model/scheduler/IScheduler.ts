import type {IScheduledJob} from "./impl/ScheduledJob/IScheduledJob";

export interface IScheduler {

    /**
     * The stored jobs
     */
    jobs: IScheduledJob[];

    /**
     * Execute this function at a given date or cron time
     * @param name
     * @param whenToExecute
     * @param callBack
     * @param guildId
     * @param additionalArgs
     */
    register(name: string, whenToExecute: string | Date, callBack: () => void, guildId: string, additionalArgs?: Record<string, any>): IScheduledJob;

    /**
     * Get all the jobs currently registered
     * @param name
     */
    getJob(name: string): IScheduledJob;

    /**
     * Cancel the job with the given name, return true if the job is found and cancelled
     * @param name
     * @return boolean - true if found and cancelled
     */
    cancelJob(name: string): boolean;

    /**
     * Cancel all the jobs known to this object
     */
    cancelAllJobs(): void;
}