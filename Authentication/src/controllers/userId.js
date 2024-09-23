const amqp = require("amqplib");

module.exports.userId = async (userId) => {
  const connection = await amqp.connect("amqp://localhost:5672");
  const channel = await connection.createChannel();
  const message = JSON.stringify({ userId });
  const result = await channel.assertQueue("USER_QUEUE");
  channel.sendToQueue("USER_QUEUE", Buffer.from(message));
  console.log("userId sent successfully to queue...");
};
