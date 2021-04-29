import {NextFunction, Request, Response} from 'express';
import {ArrayUtils} from "../../../utils/Utils";
import {AutoResponderPayload} from "../../../model/types/Typeings";

export function EventSecurityConstraintTypeValidator(req: Request, res: Response, next: NextFunction): void {

    const {allowedChannels, allowedRoles, ignoredChannels, ignoredRoles}: AutoResponderPayload = req.body;
    const exceptions: string[] = [];
    if (ArrayUtils.isValidArray(allowedChannels) && ArrayUtils.isValidArray(ignoredChannels)) {
        exceptions.push("You can not have both allowed and ignored channels at the same time");
    }
    if (ArrayUtils.isValidArray(allowedRoles) && ArrayUtils.isValidArray(ignoredRoles)) {
        exceptions.push("You can not have both allowed and ignored roles at the same time");
    }
    if (ArrayUtils.isValidArray(exceptions)) {
        next(new Error(exceptions.join("\n")));
    }
    next();
}