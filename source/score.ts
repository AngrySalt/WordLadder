/**
 * Stores user score data, examples include:
 * Highest word streak
 * Words used
 */
import { DataTypes, Sequelize } from "sequelize";
import settings from "../settings.json" with {type:"json"}

const sequelize = new Sequelize('postgres', 'postgres', settings.postgres_password, {
	host: 'localhost',
	dialect: "postgres",
	logging: false,
});

export const Scores = sequelize.define("scores",{
    id: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey:true
    },
    highest_streak: { 
        type: DataTypes.INTEGER,
        defaultValue:0
    },
    total_plays: {
        type: DataTypes.INTEGER,
        defaultValue:0
    },
    endless_plays: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0
    },
    used_words: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});