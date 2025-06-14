/**
 * Allows players to play the word ladders
 */
import { Events, MessageType, Message, Client } from "discord.js";
import { Game } from "./game.js";

export function oneCharacterDifference(a : string,b : string) : boolean {
    let nonMatchingCharacters = 0
    for (let i = 0; i < a.length && nonMatchingCharacters < 2;i++) {
        if (a.at(i) != b.at(i)) nonMatchingCharacters++;
    }
    return nonMatchingCharacters === 1;
}

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
        if (!oneCharacterDifference(msgText,game.currentWord)) {
            message.react("❌");
            return;
        }
        // Check the dictionary api to ensure word is real
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
            message.react("❓"); // Dictionary api may be down, still count as correct.
            game.dictionaryBlocked = true; // But don't submit the score, too dangerous to do so.
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
