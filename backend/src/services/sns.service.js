const { sns } = require('../config/aws.config');
require('dotenv').config();

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const SnsService = {
  async publishMessage(message, subject) {
    if (!SNS_TOPIC_ARN) {
      console.warn('SNS_TOPIC_ARN is not defined. Skipping SNS notification.');
      return;
    }
    const params = {
      Message: message,
      Subject: subject,
      TopicArn: SNS_TOPIC_ARN
    };
    try {
      const data = await sns.publish(params).promise();
      console.log('SNS notification sent:', data.MessageId);
      return data;
    } catch (err) {
      console.error('Error sending SNS notification:', err);
    }
  },

  async sendTradeConfirmation(userId, order) {
    const message = `Order ${order.type} confirmed! \nOrder Details:\n` +
      `- Order ID: ${order.order_id}\n` +
      `- Stock: ${order.stock_symbol}\n` +
      `- Type: ${order.type}\n` +
      `- Quantity: ${order.quantity}\n` +
      `- Price: $${order.price.toFixed(2)}\n` +
      `- Timestamp: ${new Date().toISOString()}`;
    return this.publishMessage(message, `Trade Confirmation - ${order.type} ${order.stock_symbol}`);
  },

  async sendPriceAlert(symbol, price, threshold) {
    const message = `Stock Alarm: ${symbol} has reached $${price.toFixed(2)}, surpassing your threshold of $${threshold.toFixed(2)}.`;
    return this.publishMessage(message, `Stock Price Alert - ${symbol}`);
  }
};

module.exports = SnsService;
