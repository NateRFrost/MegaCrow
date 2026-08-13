export enum EngineCategories {
    ctf = 0,
    slayer = 1,
    oddball = 2,
    koth = 3,
    juggernaut = 4,
    territories = 5,
    assault = 6,
    infection = 7,
    vip = 8,
    invasion = 9,
    stockpile = 10,
    action_sack = 11,
    race = 12,
    headhunter = 13,
    wip = 14,
    dogfight = 15,
    insane = 16,
    bungie = 17,
    ms343 = 18,
    heroic = 19,
    legendary = 20,
    mythic = 21,
    mantis = 22,
    shishka = 23,
    huevos = 24,
    jonnyo = 25,
    dangerboy = 26,
    holiday = 27,
    community = 28,
    matchmaking = 29,
    pre_game_warm_up = 30,
}

// sigh
// id love to use Zod here but
// i cant justify bringing in Zod just for this
export const parseEnumCategory = (category: string) => {
    switch (category) {
        case "ctf":
            return EngineCategories.ctf;
        case "slayer":
            return EngineCategories.slayer;
        case "oddball":
            return EngineCategories.oddball;
        case "koth":
            return EngineCategories.koth;
        case "juggernaut":
            return EngineCategories.juggernaut;
        case "territories":
            return EngineCategories.territories;
        case "assault":
            return EngineCategories.assault;
        case "infection":
            return EngineCategories.infection;
        case "vip":
            return EngineCategories.vip;
        case "invasion":
            return EngineCategories.invasion;
        case "stockpile":
            return EngineCategories.stockpile;
        case "action_sack":
            return EngineCategories.action_sack;
        case "race":
            return EngineCategories.race;
        case "headhunter":
            return EngineCategories.headhunter;
        case "wip":
            return EngineCategories.wip;
        case "dogfight":
            return EngineCategories.dogfight;
        case "insane":
            return EngineCategories.insane;
        case "bungie":
            return EngineCategories.bungie;
        case "ms343":
            return EngineCategories.ms343;
        case "heroic":
            return EngineCategories.heroic;
        case "legendary":
            return EngineCategories.legendary;
        case "mythic":
            return EngineCategories.mythic;
        case "mantis":
            return EngineCategories.mantis;
        case "shishka":
            return EngineCategories.shishka;
        case "huevos":
            return EngineCategories.huevos;
        case "jonnyo":
            return EngineCategories.jonnyo;
        case "dangerboy":
            return EngineCategories.dangerboy;
        case "holiday":
            return EngineCategories.holiday;
        case "community":
            return EngineCategories.community;
        case "matchmaking":
            return EngineCategories.matchmaking;
        case "pre_game_warm_up":
            return EngineCategories.pre_game_warm_up;
        default:
            return undefined;
    }
}
