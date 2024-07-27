// services/messageBroker.js

import amqplib from "amqplib";
import {
  MESSAGE_BROKER_URL,
  EXCHANGE_NAME,
  ANIME_QUEUE_NAME,
} from "../config/index.js";

/* ------------------------------ MESSAGE BROKER ------------------------------ */

export const CreateChannel = async () => {
  try {
    const connection = await amqplib.connect(MESSAGE_BROKER_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });

    await channel.assertQueue(ANIME_QUEUE_NAME, { durable: true });

    await channel.bindQueue(ANIME_QUEUE_NAME, EXCHANGE_NAME, ANIME_QUEUE_NAME);

    return channel;
  } catch (err) {
    console.error("Error creating channel:", err);
    throw err;
  }
};

export const PublishMessage = async (channel, bindingKey, message) => {
  try {
    await channel.publish(EXCHANGE_NAME, bindingKey, Buffer.from(message));
    console.log(`Message published to ${bindingKey}: ${message}`);
  } catch (err) {
    console.error("Error publishing message:", err);
    throw err;
  }
};

export const SubscribeMessage = async (channel, service, bindingKey) => {
  try {
    const appQueue = await channel.assertQueue(ANIME_QUEUE_NAME);

    await channel.bindQueue(appQueue.queue, EXCHANGE_NAME, bindingKey);

    channel.consume(appQueue.queue, (data) => {
      if (data !== null) {
        console.log("Received data in AniData service:");
        const messageContent = data.content.toString();
        console.log(messageContent);

        service.handleIncomingMessage(messageContent);

        channel.ack(data);
      }
    });

    console.log(`Subscribed to queue: ${bindingKey}`);
  } catch (err) {
    console.error("Error subscribing to queue:", err);
    throw err;
  }
};
