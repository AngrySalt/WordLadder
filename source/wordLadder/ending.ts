/**
 * Ends word ladders
 */
import { Client, Events } from "discord.js";
import { Game } from "./game.js";
import { getGame } from "./gameplay.js";
import secrets from "../../secrets.json" with {type: "json"}

export function ready(client : Client) {
    client.on(Events.MessageDelete,(message)=>{
        if (message.author.id != secrets.id) return;
        getGame(message.id)?.end("Admin ended the game",client);
    });
    client.on(Events.MessageReactionAdd,(reaction,user)=>{
        if (reaction.emoji.name == "❌") {
            const game = Game.games.get(user.id);
            if (game?.messageIds.includes(reaction.message.id)) game.end("Original user ended the game",client);
        }
    });
    // End games that haven't been active in over 3 minutes
    client.on(Events.ClientReady,()=>{
        setInterval(()=>Game.games.forEach((game)=>{
            // 3 minutes
            if ((Date.now() - game.lastReplied) >= 180000) game.end("Game expired because nobody replied",client);
        }),30000) // 30 seconds
    });
}
