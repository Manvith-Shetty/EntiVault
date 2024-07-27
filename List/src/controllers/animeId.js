import { CreateChannel, PublishMessage } from "../utils/index.js";

export const anime = async (animeId) => {
  const channel = await CreateChannel();
  const message = JSON.stringify({ animeId });
  await PublishMessage(channel, "anime", message);
};
