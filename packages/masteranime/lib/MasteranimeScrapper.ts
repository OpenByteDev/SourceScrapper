import { MasteranimeHoster } from './MasteranimeHoster';

import jsonic = require('jsonic');
import { HosterRunnerScrapper, IHosterData, IRunnerScrapperOptions, Scrap } from 'sourcescrapper-core';
import { HtmlRunner, IHtmlRunnerArgs, IHtmlRunnerOptions } from 'sourcescrapper-html-runner';

export interface IMasteranimeHosterData extends IHosterData {
    data: IEpisodeDetailed;
    hosters: MasteranimeHoster[];
}

export interface IEpisodeDetailed {
    anime: {
        info: IShortAnimeInfo;
        poster: string;
        episodes: {
            current: ICurrentEpisode;
            next: IEpisode | null;
            prev: IEpisode | null;
        };
    };
    mirrors: IMirror[];
    auto_update: number[];
}
export interface IEpisode {
    id: number;
    episode: string;
}
export interface ICurrentEpisode extends IEpisode {
    subbed: number;
    dubbed: number;
    type: number;
    title: string | null;
    duration: number | null;
    created_at: string;
    tvdb_id: number | null;
    description: string | null;
    aired: string | null;
    users: IUser[] | null;
    extra_viewers: number;
}
export interface IUser {
    id: number;
    name: string;
    last_time_seen: string;
    is_online: boolean;
    avatar: IAvatar | null;
}
export interface IAvatar {
    id: string;
    path: string;
    extension: string;
    file: string;
}
export interface IShortAnimeInfo {
    id: number;
    title: string;
    slug: string;
    episode_length: number;
}
export interface IMirror {
    id: number;
    host_id: number;
    embed_id: string;
    quality: number;
    type: number;
    host: IHost;
}
export interface IHost {
    id: number;
    name: string;
    embed_prefix: string;
    embed_suffix: string | null;
}

export type IMasteranimeScrapperOptions = IRunnerScrapperOptions<IHtmlRunnerOptions>;

export class MasteranimeScrapper extends HosterRunnerScrapper<IMasteranimeHosterData> {
    public static Name: string = 'masteranime';
    public static Domains: string[] = ['masterani.me'];
    public static UrlPattern: RegExp =
        /(?:(?:https?:)?\/\/)?(?:[^.]+\.)?masterani\.me\/anime\/watch\/(\d+-(?:\w+-)+\w+)\/(\d+)/i;
    public static DefaultOptions: IMasteranimeScrapperOptions = {};
    public static Runner: HtmlRunner<IMasteranimeHosterData> = new HtmlRunner<IMasteranimeHosterData>();
    public static async scrap(
        url: string,
        options?: IMasteranimeScrapperOptions): Promise<Scrap<IMasteranimeHosterData>> {
        return new MasteranimeScrapper().scrap(url, options);
    }
    public name: string = MasteranimeScrapper.Name;
    public domains: string[] = MasteranimeScrapper.Domains;
    public urlPattern: RegExp = MasteranimeScrapper.UrlPattern;
    public defaultOptions: IMasteranimeScrapperOptions = MasteranimeScrapper.DefaultOptions;
    public runner: HtmlRunner<IMasteranimeHosterData>  = MasteranimeScrapper.Runner;
    protected async execWithArgs({ html }: IHtmlRunnerArgs): Promise<IMasteranimeHosterData> {
        const argsRegex = /<script[^>]*>\s*(?:(?:var|let|const)\s*)?args\s*=\s*({.*?})\s*(;\s*)?<\/script>/i;
        const argsData = argsRegex.exec(html);
        if (argsData === null || argsData.length < 2)
            return Promise.reject(new Error('Unable to find data'));
        const argsString = argsData[1];
        const data = jsonic(argsString) as IEpisodeDetailed;
        return {
            data,
            title: data.anime.info.title,
            hosters: data.mirrors.map(e => new MasteranimeHoster({
                name: e.host.name,
                quality: e.quality,
                url:
                (e.host.embed_prefix || '').replace(/\\\//g, '/') +
                e.embed_id +
                (e.host.embed_suffix || ''),
                host_id: e.host_id,
                embed_id: e.embed_id,
                host: e.host,
                type: e.type
            }))
        };
    }
}
