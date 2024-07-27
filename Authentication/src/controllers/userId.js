const { CreateChannel, PublishMessage } = require("../utils/index.js");

module.exports.userId = async (userId) => {
  const channel = await CreateChannel();
  const message = JSON.stringify({ userId });
  await PublishMessage(channel, "authentication", message);
};
