import { ChatInputCommandInteraction, Client, Colors, EmbedBuilder, GuildTextBasedChannel, Message, MessageCreateOptions } from "discord.js";
import { Scores } from "../score.js";

export class Game {
    static games : Map<string,Game> = new Map();
    messageIds : string[] = [];
    usedWords : string[] = [];
    multiplayer : boolean
    startingWord : string
    currentWord : string
    startingUserId : string
    startingUserName : string
    startingChannelId : string
    winningWord? : string
    lastReplied : number
    dictionaryBlocked : boolean = false // Turns true if we can't access the dictionary api
    private sendMessage(newMessage : MessageCreateOptions,client : Client) {
        const channel = client.channels.cache.get(this.startingChannelId) as GuildTextBasedChannel;
        channel.send(newMessage);
    }
    private async saveStreak() {
        const score = await Scores.findOne({where: {id: this.startingUserId}});
        // If this is a highscore, save it.
        let highestStreak : number = score.getDataValue("highest_streak") || 0;
        highestStreak = Math.max(this.usedWords.length,highestStreak);
        // Save the used words
        let globalUsedWords : string[] = score.getDataValue("used_words");
        let newUsedWords : string[];
        if (globalUsedWords.length===0) newUsedWords = this.usedWords;
        else {
            // Merge the two arrays without duplicates
            const newGlobalUsedWords = [...globalUsedWords];
            for (let i = 0;i<this.usedWords.length;i++) {
                const word = this.usedWords[i];
                if (!globalUsedWords.includes(word)) newGlobalUsedWords.push(word);
            }
            newUsedWords = newGlobalUsedWords;
        }
        score.update({
            highest_streak: highestStreak,
            used_words: newUsedWords
        });
    }
    private getEmbedWithStartingGameData() : EmbedBuilder {
        return new EmbedBuilder()
            .addFields({name:"Starting Word",value:this.startingWord})
            .addFields(this.winningWord?{name:"Winning Word",value:this.winningWord}:{name:"Endless",value:"No winning word, try to get the best score"})
            .setFooter({text:`Started by ${this.startingUserName}`})
    }
    getOngoingGameEmbed() : EmbedBuilder {
        return this.getEmbedWithStartingGameData()
            .setTitle(`${this.multiplayer?"Multiplayer":"Singleplayer"} Word Ladder`)
            .setDescription("Reply to this message with a word to play")
            .setColor(Colors.Green)
            .addFields({name:"Current Word",value:this.currentWord})
    }
    end(reason : string,client : Client) {
        const embed = this.getEmbedWithStartingGameData()
            .setTitle("❌ Word Ladder Ended")
            .setDescription(reason)
            .setColor(Colors.Red)
            .addFields({name:"Word Count",value:this.usedWords.length.toString()});
        this.sendMessage({embeds:[embed]},client);
        Game.games.delete(this.startingUserId);
        if (this.dictionaryBlocked) return;
        this.saveStreak();
    }
    win(message : Message<true>,client : Client) {
        message.react("✅");
        const embed : EmbedBuilder = this.getEmbedWithStartingGameData()
            .setTitle("Word Ladder Won!")
            .setColor(Colors.Green)
            .addFields({name:"Word Count",value:(this.usedWords.length+1).toString()});
        this.sendMessage({embeds:[embed]},client);
        Game.games.delete(this.startingUserId);
        if (this.dictionaryBlocked) return;
        Scores.increment("wins",{where:{id:this.startingUserId}}).then(()=>this.saveStreak());
    }
    start(interaction : ChatInputCommandInteraction) {
        this.lastReplied = Date.now();
        this.startingChannelId = interaction.channel.id;
        this.startingUserName = interaction.user.username;
        interaction.reply({embeds:[this.getOngoingGameEmbed()]});
        // Set the game first so that the user can't create multiple
        Game.games.set(interaction.user.id,this);
        interaction.fetchReply().then(message=>this.messageIds.push(message.id));
        Scores.findOrCreate({where:{id:this.startingUserId}}).then(([model])=>{
            model.increment(this.winningWord?["total_plays"]:["total_plays","endless_plays"]);
            model.save();
        });
    }
    constructor(userId : string,beginningWord : string,multiplayer : boolean,winningWord? : string) {
        this.multiplayer = multiplayer;
        this.startingWord = beginningWord
        this.currentWord = beginningWord
        this.winningWord = winningWord;
        this.startingUserId = userId;
    }
}



