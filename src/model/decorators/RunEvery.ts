import {TimeUtils} from "../../utils/Utils";
import {container} from "tsyringe";
import {AsyncTask, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";

export const scheduler = new ToadScheduler();

/**
 * Run a method on this bean every x as defined by the time unit. <br />
 * <strong>Note: the class containing this method must be registered with tsyringe for this decorator to work</strong>
 * @param time
 * @param timeUnit
 * @param runImmediately
 * @constructor
 */
export function RunEvery(time: number, timeUnit: TimeUtils.METHOD_EXECUTOR_TIME_UNIT | string, runImmediately: boolean = true) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        container.afterResolution(
            target.constructor,
            (_t, result, resolutionType) => {
                const task = new AsyncTask('simple task', () => {
                    return descriptor.value.call(result);
                }, err => {
                    console.error(err);
                });
                const job = new SimpleIntervalJob({
                    [timeUnit]: time,
                    runImmediately
                }, task);
                scheduler.addSimpleIntervalJob(job);
            },
            {
                frequency: "Once"
            }
        );
    };
}
