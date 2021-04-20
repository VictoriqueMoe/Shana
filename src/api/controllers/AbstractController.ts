import {Response} from "express";
import {getReasonPhrase, StatusCodes} from "http-status-codes";

export abstract class AbstractController {

    protected doError(res: Response, message: string, status: StatusCodes): Response {
        return res.status(status).json({
            error: `${status} ${getReasonPhrase(status)}`,
            message: message
        });
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    protected ok(res: Response, json: object): Response {
        return res.status(StatusCodes.OK).json(json);
    }
}
