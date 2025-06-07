import { APIApplicationCommandOptionChoice, Colors, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "../commandParser.js";
import path from "node:path";
import fs from "node:fs";

const infoFolder = path.join(import.meta.dirname,"..","..","info");
const slashCommand = new SlashCommandBuilder().setName("info").setDescription("Gives imformation on certain topics regarding Word Ladder")
.addStringOption((builder)=>{
    const choices : APIApplicationCommandOptionChoice<string>[] = fs.readdirSync(infoFolder).map(name=>{
        const infoName = name.substring(0,name.length-4);
        return {name:infoName,value:infoName}
    });
    return builder.setName("topic").setDescription("The topic this bot will give imformation about").setChoices(...choices).setRequired(false);
});

export const InfoCommand : Command = {
    data: slashCommand.toJSON(),
    async execute(interaction, _) {
        const topic = interaction.options.getString("topic",false) || "general";
        const text =  fs.readFileSync(path.join(infoFolder,topic+".txt"),'utf-8');
        interaction.reply({embeds:[new EmbedBuilder().setTitle("Info: "+topic.at(0).toUpperCase()+topic.substring(1)).setDescription(text).setAuthor({name:"AngrySalt"}).setColor(Colors.Blurple)]}); 
    },
}

