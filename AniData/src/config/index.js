import dotEnv from "dotenv";
dotEnv.config();

export const PORT = process.env.PORT;

export const MESSAGE_BROKER_URL = process.env.MESSAGE_BROKER_URL;

export const EXCHANGE_NAME = "ENTIVAULT";

export const QUEUE_NAME = "ANIMEDATA_QUEUE";
