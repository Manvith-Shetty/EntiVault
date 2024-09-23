import amqp from "amqplib";

export const userId = async () => {
  const connection = await amqp.connect("amqp://localhost:5672");
  const channel = await connection.createChannel();
  const result = await channel.assertQueue("USER_QUEUE");
  channel.consume("USER_QUEUE", (message) => {
    const { userId } = JSON.parse(message.content.toString());
    console.log(`Received user ID from USER_QUEUE: ${userId}`);
    return userId;
  });
};
