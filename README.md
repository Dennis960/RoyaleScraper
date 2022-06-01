# RoyaleScraper

This node-based typescript application accesses the Clash Royale api and fetches player data.

Run the code by cloning the repository and installing the node packages.

Then run ts-node ./src/index.ts

# Settings

Settings are found at the top of `index.ts`

- `let API_TOKEN` - Your token from the [account page of clash royale](https://developer.clashroyale.com/#/account).
- `let DATA_PATH` - Where to store the output.
- `let DUMP_FILE` - Filename of the output njson file.
- `let PLAYER_TAGS_FILE` - Filename of the csv tracking all player tags.
- `let SHOULD_PRINT_PROGRESS` - Set true to print a progress bar.

- `let STACK_SIZE` - Number of players fetched per country each iteration.
- `const ITERATION_COUNT` - Number of iterations.

# Default Settings

- `let STACK_SIZE = 4;`
- `const ITERATION_COUNT = 20;`

Results in arround 20k players and takes arround 23 minutes to complete.
