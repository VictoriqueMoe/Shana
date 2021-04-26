import {GuardFunction} from "@typeit/discord";

export const AdminOnlyTask: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
};