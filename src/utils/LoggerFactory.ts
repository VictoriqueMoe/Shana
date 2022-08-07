import type winston from "winston";
import {createLogger, format, transports} from "winston";
import type * as Transport from "winston-transport";

class LoggerFactory {

    private readonly _logger: winston.Logger;

    public constructor() {
        const {combine, splat, timestamp, printf} = format;

        const myFormat = printf(({level: l, message: m, timestamp: t, ...metadata}) => {
            let msg = `⚡ ${t} [${l}] : ${m} `;
            if (metadata && JSON.stringify(metadata) !== "{}") {
                msg += JSON.stringify(metadata);
            }
            return msg;
        });

        const transportsArray: Transport[] = [
            new transports.Console({
                level: "debug",
                format: combine(format.colorize(), splat(), timestamp(), myFormat)
            }),
            new transports.File({
                level: "info",
                format: format.combine(format.timestamp(), format.json()),
                filename: `${process.cwd()}/combined.log`
            })
        ];

        this._logger = createLogger({
            level: "debug",
            transports: transportsArray
        });
    }

    public get logger(): winston.Logger {
        return this._logger;
    }
}

const logger = new LoggerFactory().logger;
export default logger;
