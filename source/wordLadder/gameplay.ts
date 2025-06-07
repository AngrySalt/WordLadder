/**
 * Allows players to play the word ladders
 */
import { Events, MessageType, Message, Client } from "discord.js";
import { Game } from "./game.js";

export function ready(client : Client) {
    client.on(Events.MessageCreate,async (message)=>{
        if (message.system || message.author.bot || message.type != MessageType.Reply || !message.content.match("^[A-z]+$")) return;
        const game = getGameAsUser(message.member.user.id,message.reference.messageId);
        if (!game) return;
        // Stop the game from ending
        game.lastReplied = Date.now();
        if (game.currentWord.length != message.content.length) {
            message.react("❌");
            return;
        };
        const msgText = message.content.toLowerCase();
        if (game.winningWord && msgText == game.winningWord) {
            game.win(message as Message<true>,client);
            return;
        }
        if (msgText == game.startingWord || msgText == game.currentWord || game.usedWords.includes(msgText)) {
            message.react("❌");
            return;
        }
        // Make sure new word is only one letter away
        let nonMatchingCharacters = 0;
        for (let i = 0; i < msgText.length && nonMatchingCharacters < 2;i++) {
            if (msgText.at(i) != game.currentWord.at(i)) nonMatchingCharacters++;
        }
        if (nonMatchingCharacters != 1) {
            message.react("❌");
            return;
        }
        let isWord = true;
        fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+msgText).then(async (v)=>{
            const jsonData = await v.json();
            if (jsonData.title == "No Definitions Found") {
                message.react("❌");
                isWord = false
                return;
            }
            message.react("✅");
        }).catch((e)=>{
            message.react("❓");
        }).finally(async ()=>{
            if (!isWord) return;
            game.usedWords.push(msgText);
            game.currentWord = msgText;
            game.messageIds.push((await message.channel.send({embeds:[game.getOngoingGameEmbed()]})).id);
        });
    });
}


export function getGame(messageId : string) : Game | undefined {
    const gameEntryIterator = Game.games.entries();
    let gameEntry = gameEntryIterator.next();
    while (!gameEntry.done) {
        if ((gameEntry.value[1] as Game).messageIds.includes(messageId)) return (gameEntry.value[1] as Game).multiplayer?Game.games.get(gameEntry.value[0]):undefined;
        gameEntry = gameEntryIterator.next();
    }
}

function getGameAsUser(userId : string,messageId : string) : Game | undefined {
    const game = Game.games.get(userId);
    return game?.messageIds.includes(messageId)?game:getGame(messageId);
}
