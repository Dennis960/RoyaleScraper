import { config } from "./config";
import { MultiBar, Presets, SingleBar } from "cli-progress";

let multibar: MultiBar;
let totalPlayersBar: SingleBar, iterationBar: SingleBar, locationBar: SingleBar;
let locationTimes: number[] = [];
let playerTimes: number[] = [];

export function initProgressBar(locationsCount: number) {
  if (config.SHOULD_PRINT_PROGRESS) {
    multibar = new MultiBar(
      {
        format:
          "{title} [{bar}] {percentage}% | {name} | {value}/{total} | {speed}/s",
        clearOnComplete: false,
        hideCursor: true,
      },
      Presets.shades_grey
    );

    iterationBar = multibar.create(config.ITERATION_COUNT, 0, {
      title: "Iteration",
      name: "".padEnd(30, " "),
      speed: "-",
    });
    locationBar = multibar.create(locationsCount, 0, {
      title: "Location ",
      name: "".padEnd(30, " "),
      speed: "-",
    });
    totalPlayersBar = multibar.create(1, 0, {
      title: "Players  ",
      name: "".padEnd(30, " "),
      speed: "",
    });
  }
}
export function onPlayerAdded(playerTag: string) {
  if (config.SHOULD_PRINT_PROGRESS) {
    playerTimes.push(new Date().valueOf());
    let last30PlayerTimes = playerTimes.slice(-30);
    let speed = 1000 / ((last30PlayerTimes[29] - last30PlayerTimes[0]) / 30);
    totalPlayersBar.increment({
      name: playerTag.padEnd(30, " "),
      speed: Math.round(speed),
    });
  }
}

export function onLocationAdded(locationName: string) {
  if (config.SHOULD_PRINT_PROGRESS) {
    locationTimes.push(new Date().valueOf());
    let last30LocationTimes = locationTimes.slice(-30);
    let speed =
      1000 / ((last30LocationTimes[29] - last30LocationTimes[0]) / 30);
    locationBar.increment({
      name: locationName.padEnd(30, " "),
      speed: Math.round(speed),
    });
  }
}
export function onIterationIncremented(
  totalPlayerCount: number,
  locationsCount: number
) {
  if (config.SHOULD_PRINT_PROGRESS) {
    iterationBar.increment();
    totalPlayersBar.update(0);
    totalPlayersBar.setTotal(totalPlayerCount);
    locationBar.update(0);
    locationBar.setTotal(locationsCount);
  }
}

export function stopProgressBars() {
  if (config.SHOULD_PRINT_PROGRESS) {
    multibar.stop();
  }
}

export function error429() {
  if (config.SHOULD_PRINT_PROGRESS) {
    totalPlayersBar.update({
      name: "ERROR 429, please wait...".padEnd(30, " "),
    });
  }
}
