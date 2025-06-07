import { ChatInputCommandInteraction, Client, Events, InteractionReplyOptions, MessagePayload, REST, RESTPatchAPIApplicationCommandJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, SlashCommandBooleanOption, SlashCommandBuilder } from "discord.js";
import { createRequire } from "module";
import fs from "node:fs";
import path from "node:path";
import secrets from "../secrets.json" with {type: "json"}
const require = createRequire(import.meta.url);

export class Command {
    data : RESTPostAPIChatInputApplicationCommandsJSONBody
    execute : (interaction : ChatInputCommandInteraction,client : Client) => Promise<string | MessagePayload | InteractionReplyOptions | void>
}

export function parseCommands(client : Client) {
    const commandFolderPath = path.join(import.meta.dirname,"commands")
    const commandFiles = fs.readdirSync(commandFolderPath).filter((file)=>file.endsWith(".js"));
    const commandData : RESTPatchAPIApplicationCommandJSONBody[] = [];
    const comamndExecution : Map<string,(interaction : ChatInputCommandInteraction,client : Client) => Promise<string | MessagePayload | InteractionReplyOptions | void>> = new Map();

    commandFiles.forEach((rawFileName)=>{
        const filePath = path.join(commandFolderPath,rawFileName);
        const fileData = require(filePath);
        const fileName = rawFileName.substring(0,rawFileName.length-3);
        const commandName = fileName.at(0).toUpperCase()+fileName.substring(1)+"Command"; // wordladder => WordladderCommand
        if (!(commandName in fileData)) return;
        const command : Command = fileData[commandName];
        commandData.push(command.data);
        comamndExecution.set(command.data.name,command.execute);
    });

    client.on(Events.InteractionCreate,async (interaction)=>{
        if (interaction.isChatInputCommand() && comamndExecution.has(interaction.commandName)) {
            const reply = await comamndExecution.get(interaction.commandName)(interaction,client);
            if (reply) interaction.reply(reply);
        };
    });

    const rest = new REST().setToken(secrets.token);
    (async () => {
        try {
            console.log(`Refreshing ${commandData.length} (/) commands`)
            const registeredCommands = await rest.put(Routes.applicationCommands(secrets.id),{body:commandData}) as [];
            console.log(`Succesfully refreshed ${registeredCommands.length} (/) commands`);
        } catch(e) {
            console.error("Error while refreshing (/) commands: %d",e);
        }
    })();
}