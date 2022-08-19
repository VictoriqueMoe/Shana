import type {Logger} from "winston";
import {createLogger, format, transports} from "winston";
import type * as Transport from "winston-transport";

class LoggerFactory {

    private readonly _logger: Logger;

    public constructor() {
        const {combine, splat, timestamp, printf, colorize} = format;

        const myFormat = printf(({level: l, message: m, timestamp: t, ...metadata}) => {
            let msg = `⚡ ${t} [${l}] : ${m} `;
            if (metadata && JSON.stringify(metadata) !== "{}") {
                msg += JSON.stringify(metadata);
            }
            if (m.constructor === Object) {
                msg += JSON.stringify(m, null, 4);
            }
            return msg;
        });

        const transportsArray: Transport[] = [
            new transports.Console({
                level: "debug",
                format: combine(colorize(), splat(), timestamp(), myFormat)
            })
        ];

        this._logger = createLogger({
            level: "debug",
            transports: transportsArray
        });
    }

    public get logger(): Logger {
        return this._logger;
    }
}

const logger = new LoggerFactory().logger;
export default logger;
