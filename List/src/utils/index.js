// ../utils/index.js

import amqplib from "amqplib";
import {
  MESSAGE_BROKER_URL,
  EXCHANGE_NAME,
  AUTH_QUEUE_NAME,
  ANIME_QUEUE_NAME,
} from "../config/index.js";

export const CreateChannel = async () => {
  try {
    const connection = await amqplib.connect(MESSAGE_BROKER_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });

    await channel.assertQueue(AUTH_QUEUE_NAME, { durable: true });
    await channel.bindQueue(AUTH_QUEUE_NAME, EXCHANGE_NAME, AUTH_QUEUE_NAME);

    await channel.assertQueue(ANIME_QUEUE_NAME, { durable: true });
    await channel.bindQueue(ANIME_QUEUE_NAME, EXCHANGE_NAME, ANIME_QUEUE_NAME);

    return channel;
  } catch (err) {
    console.error("Error creating channel:", err);
    throw err;
  }
};

export const PublishMessage = async (channel, binding_key, message) => {
  try {
    await channel.publish(EXCHANGE_NAME, binding_key, Buffer.from(message));
    console.log(`Message published to ${binding_key}: ${message}`);
  } catch (err) {
    console.error("Error publishing message:", err);
    throw err;
  }
};

export const SubscribeMessage = async (channel, service, binding_key) => {
  try {
    const appQueue = await channel.assertQueue(binding_key);

    await channel.bindQueue(appQueue.queue, EXCHANGE_NAME, binding_key);

    await channel.consume(appQueue.queue, (data) => {
      console.log(`Received data in ${service}:`);
      console.log(data.content.toString());

      service.handleIncomingMessage(data.content.toString());

      channel.ack(data);
    });

    console.log(`Subscribed to queue: ${binding_key}`);
  } catch (err) {
    console.error(`Error subscribing to queue ${binding_key}:`, err);
    throw err;
  }
};
