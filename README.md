# RoyaleScraper

This node-based typescript application accesses the Clash Royale api and fetches player data.

Run the code by cloning the repository and installing the node packages.

Then run ts-node ./src/index.ts

# Settings

Settings are found inside [`config.js`](config.js)

- `API_TOKEN` - Your token from the [account page of clash royale](https://developer.clashroyale.com/#/account).
- `DATA_PATH` - Where to store the output.
- `DUMP_FILE` - Filename of the output njson file.
- `PLAYER_TAGS_FILE` - Filename of the csv tracking all player tags.
- `SHOULD_PRINT_PROGRESS` - Set true to print a progress bar.

- `STACK_SIZE` - Number of players fetched per country each iteration.
- `ITERATION_COUNT` - Number of iterations.

# Default Settings

- `STACK_SIZE = 4;`
- `ITERATION_COUNT = 20;`

Results in arround 20k players and takes arround 23 minutes to complete.
Final file size: 2.7 GB
