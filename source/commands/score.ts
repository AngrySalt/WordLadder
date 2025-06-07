import { Colors, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "../commandParser.js";
import { Scores } from "../score.js";

export const ScoreCommand : Command = {
    data: new SlashCommandBuilder().setName("score").setDescription("Gets the score of the specified user").addUserOption((builder)=>
        builder.setName("user").setDescription("The user to read the score of").setRequired(false)
    ).toJSON(),
    async execute(interaction, _) {
        const user = interaction.options.getUser("user",false) ?? interaction.user;
        const score = await Scores.findOne({where: {id:user.id}});
        if (!score) return {content:"User has never played a word ladder",flags:[MessageFlags.Ephemeral]}
        const totalPlays : number = score.getDataValue("total_plays");
        const endlessPlays : number = score.getDataValue("endless_plays");

        const embed = new EmbedBuilder().setTitle(`Word Ladder scores of ${user.displayName} (@${user.username})`)
        .setFields(
            {name:"Plays",value:totalPlays.toString(),inline:true},
            {name:"Endless Plays",value:endlessPlays.toString(),inline:true},
            {name:"Goal Plays",value:(totalPlays-endlessPlays).toString(),inline:true},
            {name:"Wins",value:score.getDataValue("wins").toString(),inline:true},
            {name:"Highest streak",value:score.getDataValue("highest_streak").toString(),inline:true},
            {name:"Unique words used",value:score.getDataValue("used_words").length.toString(),inline:true},
        ).setColor(Colors.Blue).toJSON();
        return {embeds:[embed]}
    }
}