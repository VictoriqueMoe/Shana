import {GuardFunction} from "@typeit/discord";

export const OwnerOnly: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    const member = message.member;
    if (member.id === "784102705253580800" || member.id === "595455886420475926") {
        await next();
    }
};