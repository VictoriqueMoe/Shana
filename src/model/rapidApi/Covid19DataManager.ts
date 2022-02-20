import {AbstractRapidApiResponse} from "./AbstractRapidApiResponse";
import {defaultSearch, ISearchBase, options, SearchBase} from "../ISearchBase";
import {AutocompleteInteraction} from "discord.js";
import {ShanaFuse} from "../Impl/ShanaFuse";
import Fuse from "fuse.js";
import {singleton} from "tsyringe";
import {PostConstruct} from "../decorators/PostConstruct";
import axios from "axios";

type listOfCountriesResponse = {
    "name": string
    "alpha2code": string
    "alpha3code": string
    "latitude": number
    "longitude": number
}[];

type latestCountryDataByName = {
    "country": string
    "code": string
    "confirmed": number
    "recovered": number
    "critical": number
    "deaths": number
    "latitude": number
    "longitude": number
    "lastChange": string
    "lastUpdate": string
}[];


@singleton()
export class Covid19DataManager extends AbstractRapidApiResponse implements ISearchBase<SearchBase> {

    private _fuseCache: ShanaFuse<SearchBase>;

    private static baseUrl = "https://covid-19-data.p.rapidapi.com";

    public constructor() {
        super("covid-19-data.p.rapidapi.com", "GET");
    }

    @PostConstruct
    private async init(): Promise<void> {
        const countries = await axios.request({
            ...this.getBaseOptions(),
            url: `${Covid19DataManager.baseUrl}/help/countries`
        });
        const json: listOfCountriesResponse = countries.data;
        this._fuseCache = new ShanaFuse(json, options);
    }

    public async getLatestCountryDataByName(countryName: string): Promise<latestCountryDataByName> {
        const response = await axios.request({
            ...this.getBaseOptions(),
            url: `${Covid19DataManager.baseUrl}/country`,
            params: {
                name: countryName
            }
        });
        return response.data;
    }

    public search(interaction: AutocompleteInteraction): Fuse.FuseResult<SearchBase>[] {
        return defaultSearch(interaction, this._fuseCache);
    }

}
