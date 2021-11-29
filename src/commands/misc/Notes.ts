import {AbstractCommandModule} from "../AbstractCommandModule";
import {Discord} from "discordx";
import {injectable} from "tsyringe";

@Discord()
@injectable()
export class Notes extends AbstractCommandModule {

}