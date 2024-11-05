// services/whatsappNotification.js
const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to send WhatsApp Template Message
const sendWhatsAppTemplateMessage = async (to, templateSid, templateData) => {
  if (!to) {
    console.error('No phone number provided for WhatsApp template message.');
    return;
  }
  console.log(`Attempting to send WhatsApp template message to ${to} using template SID ${templateSid}`);
  
  try {
    const response = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      template: {
        namespace: process.env.TWILIO_WHATSAPP_TEMPLATE_NAMESPACE, // Ensure to add this in .env
        name: templateSid,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: templateData.map(data => ({ type: 'text', text: data }))
          }
        ]
      },
    });
    console.log(`Template message sent to ${to}`, response);
  } catch (error) {
    console.error(`Failed to send WhatsApp template message to ${to}:`, error.message);
    console.error("Full error details:", error);
  }
};

const notifyDueTasks = async (phoneNumber, dueTasks) => {
  if (!phoneNumber) {
    console.error("Phone number is undefined for due tasks notification.");
    return;
  }

  if (!Array.isArray(dueTasks)) {
    console.error("Expected an array for dueTasks, but received:", dueTasks);
    return;
  }

  try {
    const taskList = dueTasks
      .map((task, index) => `${index + 1}. *${task.title}*\n   - Description: ${task.description}\n   - Deadline: ${new Date(task.deadline).toLocaleDateString()}`)
      .join('\n\n');

    const templateData = [
      'User', // Placeholder for the user's name
      taskList,
      'https://www.nirpekshnandan.com'
    ];

    await sendWhatsAppTemplateMessage(phoneNumber, 'HXa9ff7c48552b5723c039197a4e640519', templateData);
    console.log(`Due tasks notification sent to ${phoneNumber}`);
  } catch (error) {
    console.error(`Error sending due task notification to ${phoneNumber}:`, error);
  }
};


const notifyOverdueTasks = async (phoneNumber, overdueTasks) => {
  if (!phoneNumber) {
    console.error("Phone number is undefined for overdue tasks notification.");
    return;
  }

  if (!Array.isArray(overdueTasks)) {
    console.error("Expected an array for overdueTasks, but received:", overdueTasks);
    return;
  }

  try {
    const taskMessages = overdueTasks
      .map((task, index) => `${index + 1}. *${task.title}*\n   - Description: ${task.description}\n   - Was due on: ${new Date(task.deadline).toLocaleDateString()}`)
      .join('\n\n');

    const templateData = [
      'User', // Placeholder for the user's name
      taskMessages,
      'https://www.nirpekshnandan.com'
    ];

    await sendWhatsAppTemplateMessage(phoneNumber, 'HXa5a86cda484eacba23156c0a437c6b2c', templateData);
    console.log(`Overdue tasks notification sent to ${phoneNumber}`);
  } catch (error) {
    console.error(`Error sending overdue task notification to ${phoneNumber}:`, error);
  }
};

module.exports = { notifyDueTasks, notifyOverdueTasks };
