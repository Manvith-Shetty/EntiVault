import amqp from "amqplib";

export const animeId = async () => {
  const connection = await amqp.connect("amqp://localhost:5672");
  const channel = await connection.createChannel();
  const result = await channel.assertQueue("ANIME_QUEUE");
  channel.consume("ANIME_QUEUE", (message) => {
    const { animeId } = JSON.parse(message.content.toString());
    console.log(`Received anime ID from ANIME_QUEUE: ${animeId}`);
    return animeId;
  });
};
