let config = {};

config.API_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjJhN2QzMGZlLWYxOTYtNGM1NS05MWFiLTAwNDhjYTdhZTk4YSIsImlhdCI6MTY1NDA3NTQxMywic3ViIjoiZGV2ZWxvcGVyL2YxYzIyMTBlLTMwYzItNzkxMi0zM2E4LTkxMWJmYmExNmRjOSIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyI5My4yMTAuNS4xOTgiXSwidHlwZSI6ImNsaWVudCJ9XX0.A9wygWI5N30CoVCm6b_QAwkGeQPp0YpeR5SpkBlAhcYlMlMkRCzo6sWz8j5QOJ8wmNXF7eg0v-iX_AChI_4FOw";
config.API_URL = "https://api.clashroyale.com/v1/";
config.DATA_PATH = "data/";
config.DUMP_FILE = DATA_PATH + "stuff.njson";
config.PLAYER_TAGS_FILE = DATA_PATH + "playerTags.csv";
config.SHOULD_PRINT_PROGRESS = true;

config.STACK_SIZE = 4; // amount of players to check each iteration per country
config.ITERATION_COUNT = 20; // amount of iterations

module.exports(config);