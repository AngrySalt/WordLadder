import {parseCommands} from "./commandParser.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import settings from "../settings.json" with {type: "json"}
import * as wordLadder from "./wordLadder/gameplay.js";
import * as wordLadderEnding from "./wordLadder/ending.js";
import { Scores } from "./score.js";

export const client = new Client({intents:[GatewayIntentBits.GuildMessages,GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessageReactions]});

parseCommands(client);
wordLadder.ready(client);
wordLadderEnding.ready(client);
async function login() {
    console.log("Attempting to login");
    client.login(settings.token);
    client.once(Events.ClientReady,()=>{
        Scores.sync();
        console.log("Logged in");
    })
}
login();

