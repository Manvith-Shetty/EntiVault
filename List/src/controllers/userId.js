import {
  CreateChannel,
  PublishMessage,
  SubscribeMessage,
} from "../utils/index.js";

export const userId = async () => {
  const channel = await CreateChannel();
  SubscribeMessage(channel, "authentication", async (data) => {
    const { userId } = JSON.parse(data.content.toString());

    console.log(`Received user ID: ${userId}`);

    return userId;
  });
};
