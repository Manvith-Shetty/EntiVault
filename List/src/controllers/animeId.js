import amqp from "amqplib";

export const anime = async (animeId) => {
  const connection = await amqp.connect("amqp://localhost:5672");
  const channel = await connection.createChannel();
  const message = JSON.stringify({ animeId });
  const result = await channel.assertQueue("ANIME_QUEUE");
  channel.sendToQueue("ANIME_QUEUE", Buffer.from(message));
  console.log("animeId sent successfully to queue...");
};
