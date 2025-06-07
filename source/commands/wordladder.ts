/**
 * Command to start and end word ladders
 */
import { ChatInputCommandInteraction, Client, MessageFlags, SlashCommandBuilder } from "discord.js";
import {Command} from "../commandParser.js";
import { Game } from "../wordLadder/game.js";
import { oneCharacterDifference } from "../wordLadder/gameplay.js";

export const WordladderCommand : Command = {
    data: new SlashCommandBuilder().setName("wordladder").setDescription("Manage word ladder games")
        .addSubcommand(builder=>builder.setName("start").setDescription("Start a game of word ladder")
            .addStringOption(builder=>builder.setName("start").setDescription("The word you have to build off of").setRequired(true))
            .addStringOption(builder=>builder.setName("goal").setDescription("The word to reach").setRequired(false))
            .addBooleanOption(builder=>builder.setName("multiplayer").setDescription("Allow others to answer for you").setRequired(false))
        )
        .addSubcommand(builder=>builder.setName("end").setDescription("End your game of word ladder"))
    .toJSON(),
    async execute(interaction : ChatInputCommandInteraction,client : Client) {
        if (interaction.options.getSubcommand(false) == "end") { 
            const game = Game.games.get(interaction.user.id);
            if (!game) return {content:"❌ You don't have any active Word Ladder games",flags:MessageFlags.Ephemeral};
            game.end("Original user ended the game",client);
        }
        // We could automatically end their game, but since players may think they can have multiple games at once, we won't.
        if (Game.games.has(interaction.user.id)) return {content:"❌ You already have an active game! Please end that one before creating a new one",flags:MessageFlags.Ephemeral};
        // Game settiings
        const beginningWord = interaction.options.getString("start",true)?.toLowerCase();
        const winningWord = interaction.options.getString("goal",false)?.toLowerCase();
        const multiplayer = interaction.options.getBoolean("multiplayer",false) !== false; // Defaults to true
        /**
         *  Prevent users from using too easy/impossible words
         *  Don't check for definitions here because it doesn't really matter if these words are real
        */ 
        if (beginningWord.length < 3) return {content:"❌ Word must be >2 characters",flags:MessageFlags.Ephemeral}
        if (!beginningWord.match("^[A-z]+$") ||  (winningWord && !winningWord.match("^[A-z]+$"))) return {content:"❌ Word must have 0 special characters",flags:MessageFlags.Ephemeral}
        if (winningWord) {
            if (beginningWord == winningWord) return {content:"❌ Beginning and end word must be different",flags:MessageFlags.Ephemeral}
            if (beginningWord.length != winningWord.length) return {content:"❌ Beginning word must be the same length as the winning word",flags:MessageFlags.Ephemeral}
            if (oneCharacterDifference(beginningWord,winningWord)) return {content:"❌ Beginning word must be >1 character away from ending word",flags:MessageFlags.Ephemeral}
        }
        // Start a new game
        const game = new Game(interaction.user.id,beginningWord,multiplayer,winningWord);
        game.start(interaction);
        // No reply because game.start replies for us
    }
}