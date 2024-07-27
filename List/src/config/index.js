import dotEnv from "dotenv";
dotEnv.config();

export const PORT = process.env.PORT;

export const MESSAGE_BROKER_URL = process.env.MESSAGE_BROKER_URL;

export const EXCHANGE_NAME = "ENTIVAULT";

// Existing queue for authentication service
export const AUTH_QUEUE_NAME = "LIST_QUEUE";

// New queue for sending animeId to AniData microservice
export const ANIME_QUEUE_NAME = "ANIDATA_QUEUE";
