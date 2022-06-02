import fetch, { Response } from "node-fetch";
import { Agent as HttpsAgent } from "https";
import { readApiToken } from "./utils";

import { config } from "./config";

import { fetchthrottle } from "./fetch-throttle";
import { error429 } from "./progressBar";
let throttler: Function = fetchthrottle(fetch, 1, 13);

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 90 * 60,
});
const API_TOKEN = readApiToken();

export async function fetchJsonFromApi<T>(query: String): Promise<any> {
  const response: Response = await throttler(config.API_URL + query, {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + API_TOKEN,
    },
    agent: httpsAgent,
    compress: true,
  });

  if (response.status == 200) {
    const jsonData = await response.json();
    return jsonData as T;
  } else if (response.status != 429) {
    return null;
  } else {
    error429();
    return await fetchJsonFromApi(query);
  }
}

//#region Player
export async function getPlayer(playerTag: String) {
  return await fetchJsonFromApi<{
    tag: string;
    name: string;
  }>("players/" + playerTag);
}
export async function getPlayerBattles(playerTag: String) {
  return await fetchJsonFromApi<any[]>("players/" + playerTag + "/battlelog");
}
export async function getPlayerUpcomingChests(playerTag: String) {
  return await fetchJsonFromApi("players/" + playerTag + "/upcomingchests");
}
//#endregion

//#region Clans
export async function getClan(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag);
}
export async function getClanWarlog(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/warlog");
}
export async function getClanRiverracelog(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/riverracelog");
}
export async function getClanCurrentwar(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/currentwar");
}
export async function getClanMembers(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/members");
}
export async function getClanCurrentriverrace(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/currentriverrace");
}
export async function getClansBySearchName(search: String) {
  return await fetchJsonFromApi("clans?name=" + search);
}
//#endregion

//#region Cards
export async function getCards() {
  return await fetchJsonFromApi("cards");
}
//#endregion

//#region Tournaments
export async function getTournament(tournamentTag: String) {
  return await fetchJsonFromApi("tournaments/" + tournamentTag);
}
export async function getTournamentsBySearchName(search: String) {
  return await fetchJsonFromApi("tournaments?name=" + search);
}
//#endregion

//#region Locations
export async function getLocationGlobalTournamentRankings(
  tournamentTag: String
) {
  return await fetchJsonFromApi(
    "locations/global/rankings/tournaments/" + tournamentTag
  );
}
export async function getLocations() {
  let locations = await fetchJsonFromApi<{
    items: [
      {
        isCountry: boolean;
        id: string;
        name: string;
      }
    ];
  }>("locations");
  if (!locations) {
    throw "Locations not found";
  }
  return locations;
}
export async function getPlayerRankingsAtLocation(locationId: String) {
  return await fetchJsonFromApi<{
    items: [
      {
        tag: string;
      }
    ];
  }>("locations/" + locationId + "/rankings/players");
}
//#endregion
