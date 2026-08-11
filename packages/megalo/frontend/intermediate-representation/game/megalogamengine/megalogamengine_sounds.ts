export enum MegaloSound {
  None = -1,
  Slayer = 0,
  Ctf = 1,
  FlagCaptured = 2,
  FlagDropped = 3,
  FlagRecovered = 4,
  FlagReset = 5,
  FlagStolen = 6,
  FlagTaken = 7,
  Vip = 8,
  NewVip = 9,
  VipKilled = 10,
  Juggernaut = 11,
  NewJuggernaut = 12,
  Territories = 13,
  TerritoryCaptured = 14,
  TerritoryLost = 15,
  Assault = 16,
  BombArmed = 17,
  BombDetonated = 18,
  BombDisarmed = 19,
  BombDropped = 20,
  BombReset = 21,
  BombReturned = 22,
  BombTaken = 23,
  Infection = 24,
  Infected = 25,
  LastManStanding = 26,
  NewZombie = 27,
  Oddball = 28,
  BallSpawned = 29,
  BallTaken = 30,
  BallDropped = 31,
  BallReset = 32,
  King = 33,
  HillControlled = 34,
  HillContested = 35,
  HillMoved = 36,
  Headhunter = 37,
  Stockpile = 38,
  Race = 39,
  Defense = 40,
  Offense = 41,
  DestinationMoved = 42,
  GeneratorArmed = 43,
  CoreArmed = 44,
  GeneratorDisarmed = 45,
  CoreDisarmed = 46,
  SuddenDeath = 47,
  GameOver = 48,
  BoneCvDefeat = 49,
  BoneCvPh1Defeat = 50,
  BoneCvPh1Intro = 51,
  BoneCvPh1Victory = 52,
  BoneCvPh2Defeat = 53,
  BoneCvPh2Victory = 54,
  BoneCvPh3Victory = 55,
  BoneCvVictory = 56,
  BoneSpDefeat = 57,
  BoneSpPh1Intro = 58,
  BoneSpPh1Victory = 59,
  BoneSpPh2Intro = 60,
  BoneSpPh2Victory = 61,
  BoneSpPh3Intro = 62,
  BoneSpPh3Victory = 63,
  IsleCvDefeat = 64,
  IsleCvPh1Defeat = 65,
  IsleCvPh1Intro = 66,
  IsleCvPh2Intro = 67,
  IsleCvPh2Victory = 68,
  IsleCvPh3Intro = 69,
  IsleCvPh3Victory = 70,
  IsleSpDefeat = 71,
  IsleSpPh1Defeat = 72,
  IsleSpPh1Extra = 73,
  IsleSpPh1Intro = 74,
  IsleSpPh1Victory = 75,
  IsleSpPh2Defeat = 76,
  IsleSpPh2Victory = 77,
  IsleSpPh3Victory = 78,
  IsleSpVictory = 79,
  BoneSpPh3Defeat = 80,
  IsleCvPh3Defeat = 81,
  CovyBigWin = 82,
  CovyWin1 = 83,
  CovyWin2 = 84,
  InvasionBeginning = 85,
  UnscBigWin = 86,
  UnscWin1 = 87,
  UnscWin2 = 88,
  PowerDown = 89,
  Reinforcements = 90,
  RespawnTick = 91,
  AlphaUnderAttack = 92,
  BravoUnderAttack = 93,
  CharlieUnderAttack = 94,
}

/**
 * Map a Megalo script sound keyword to its engine index.
 * Names match the managedmegalo SoundTable.
 */
export const megaloSoundFromName = (name: string): MegaloSound | undefined => {
  switch (name.toLowerCase()) {
    case "none":
      return MegaloSound.None;
    case "slayer":
      return MegaloSound.Slayer;
    case "ctf":
      return MegaloSound.Ctf;
    case "flag_captured":
      return MegaloSound.FlagCaptured;
    case "flag_dropped":
      return MegaloSound.FlagDropped;
    case "flag_recovered":
      return MegaloSound.FlagRecovered;
    case "flag_reset":
      return MegaloSound.FlagReset;
    case "flag_stolen":
      return MegaloSound.FlagStolen;
    case "flag_taken":
      return MegaloSound.FlagTaken;
    case "vip":
      return MegaloSound.Vip;
    case "new_vip":
      return MegaloSound.NewVip;
    case "vip_killed":
      return MegaloSound.VipKilled;
    case "juggernaut":
      return MegaloSound.Juggernaut;
    case "new_juggernaut":
      return MegaloSound.NewJuggernaut;
    case "territories":
      return MegaloSound.Territories;
    case "territory_captured":
      return MegaloSound.TerritoryCaptured;
    case "territory_lost":
      return MegaloSound.TerritoryLost;
    case "assault":
      return MegaloSound.Assault;
    case "bomb_armed":
      return MegaloSound.BombArmed;
    case "bomb_detonated":
      return MegaloSound.BombDetonated;
    case "bomb_disarmed":
      return MegaloSound.BombDisarmed;
    case "bomb_dropped":
      return MegaloSound.BombDropped;
    case "bomb_reset":
      return MegaloSound.BombReset;
    case "bomb_returned":
      return MegaloSound.BombReturned;
    case "bomb_taken":
      return MegaloSound.BombTaken;
    case "infection":
      return MegaloSound.Infection;
    case "infected":
      return MegaloSound.Infected;
    case "last_man_standing":
      return MegaloSound.LastManStanding;
    case "new_zombie":
      return MegaloSound.NewZombie;
    case "oddball":
      return MegaloSound.Oddball;
    case "ball_spawned":
      return MegaloSound.BallSpawned;
    case "ball_taken":
      return MegaloSound.BallTaken;
    case "ball_dropped":
      return MegaloSound.BallDropped;
    case "ball_reset":
      return MegaloSound.BallReset;
    case "king":
      return MegaloSound.King;
    case "hill_controlled":
      return MegaloSound.HillControlled;
    case "hill_contested":
      return MegaloSound.HillContested;
    case "hill_moved":
      return MegaloSound.HillMoved;
    case "headhunter":
      return MegaloSound.Headhunter;
    case "stockpile":
      return MegaloSound.Stockpile;
    case "race":
      return MegaloSound.Race;
    case "defense":
      return MegaloSound.Defense;
    case "offense":
      return MegaloSound.Offense;
    case "destination_moved":
      return MegaloSound.DestinationMoved;
    case "generator_armed":
      return MegaloSound.GeneratorArmed;
    case "core_armed":
      return MegaloSound.CoreArmed;
    case "generator_disarmed":
      return MegaloSound.GeneratorDisarmed;
    case "core_disarmed":
      return MegaloSound.CoreDisarmed;
    case "sudden_death":
      return MegaloSound.SuddenDeath;
    case "game_over":
      return MegaloSound.GameOver;
    case "bone_cv_defeat":
      return MegaloSound.BoneCvDefeat;
    case "bone_cv_ph1_defeat":
      return MegaloSound.BoneCvPh1Defeat;
    case "bone_cv_ph1_intro":
      return MegaloSound.BoneCvPh1Intro;
    case "bone_cv_ph1_victory":
      return MegaloSound.BoneCvPh1Victory;
    case "bone_cv_ph2_defeat":
      return MegaloSound.BoneCvPh2Defeat;
    case "bone_cv_ph2_victory":
      return MegaloSound.BoneCvPh2Victory;
    case "bone_cv_ph3_victory":
      return MegaloSound.BoneCvPh3Victory;
    case "bone_cv_victory":
      return MegaloSound.BoneCvVictory;
    case "bone_sp_defeat":
      return MegaloSound.BoneSpDefeat;
    case "bone_sp_ph1_intro":
      return MegaloSound.BoneSpPh1Intro;
    case "bone_sp_ph1_victory":
      return MegaloSound.BoneSpPh1Victory;
    case "bone_sp_ph2_intro":
      return MegaloSound.BoneSpPh2Intro;
    case "bone_sp_ph2_victory":
      return MegaloSound.BoneSpPh2Victory;
    case "bone_sp_ph3_intro":
      return MegaloSound.BoneSpPh3Intro;
    case "bone_sp_ph3_victory":
      return MegaloSound.BoneSpPh3Victory;
    case "isle_cv_defeat":
      return MegaloSound.IsleCvDefeat;
    case "isle_cv_ph1_defeat":
      return MegaloSound.IsleCvPh1Defeat;
    case "isle_cv_ph1_intro":
      return MegaloSound.IsleCvPh1Intro;
    case "isle_cv_ph2_intro":
      return MegaloSound.IsleCvPh2Intro;
    case "isle_cv_ph2_victory":
      return MegaloSound.IsleCvPh2Victory;
    case "isle_cv_ph3_intro":
      return MegaloSound.IsleCvPh3Intro;
    case "isle_cv_ph3_victory":
      return MegaloSound.IsleCvPh3Victory;
    case "isle_sp_defeat":
      return MegaloSound.IsleSpDefeat;
    case "isle_sp_ph1_defeat":
      return MegaloSound.IsleSpPh1Defeat;
    case "isle_sp_ph1_extra":
      return MegaloSound.IsleSpPh1Extra;
    case "isle_sp_ph1_intro":
      return MegaloSound.IsleSpPh1Intro;
    case "isle_sp_ph1_victory":
      return MegaloSound.IsleSpPh1Victory;
    case "isle_sp_ph2_defeat":
      return MegaloSound.IsleSpPh2Defeat;
    case "isle_sp_ph2_victory":
      return MegaloSound.IsleSpPh2Victory;
    case "isle_sp_ph3_victory":
      return MegaloSound.IsleSpPh3Victory;
    case "isle_sp_victory":
      return MegaloSound.IsleSpVictory;
    case "bone_sp_ph3_defeat":
      return MegaloSound.BoneSpPh3Defeat;
    case "isle_cv_ph3_defeat":
      return MegaloSound.IsleCvPh3Defeat;
    case "covy_big_win":
      return MegaloSound.CovyBigWin;
    case "covy_win1":
      return MegaloSound.CovyWin1;
    case "covy_win2":
      return MegaloSound.CovyWin2;
    case "invasion_beginning":
      return MegaloSound.InvasionBeginning;
    case "unsc_big_win":
      return MegaloSound.UnscBigWin;
    case "unsc_win1":
      return MegaloSound.UnscWin1;
    case "unsc_win2":
      return MegaloSound.UnscWin2;
    case "power_down":
      return MegaloSound.PowerDown;
    case "reinforcements":
      return MegaloSound.Reinforcements;
    case "respawn_tick":
      return MegaloSound.RespawnTick;
    case "alpha_under_attack":
      return MegaloSound.AlphaUnderAttack;
    case "bravo_under_attack":
      return MegaloSound.BravoUnderAttack;
    case "charlie_under_attack":
      return MegaloSound.CharlieUnderAttack;
    default:
      return undefined;
  }
};
