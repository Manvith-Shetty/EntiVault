import {
  CreateChannel,
  PublishMessage,
  SubscribeMessage,
} from "../utils/index.js";

export const animeId = async () => {
  const channel = await CreateChannel();
  SubscribeMessage(channel, "anime", async (data) => {
    const { animeId } = JSON.parse(data.content.toString());

    console.log(`Received anime ID: ${animeId}`);

    return animeId;
  });
};
