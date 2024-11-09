// services/whatsappNotification.js
const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsAppTemplateMessage = async (to, contentSid, templateData) => {
  if (!to) {
    console.error('No phone number provided for WhatsApp template message.');
    return;
  }
  console.log(`Attempting to send WhatsApp template message to ${to} using contentSid ${contentSid}`);

  try {
    const contentVariables = JSON.stringify({
      '1': templateData[0],
      '2': templateData[1],
      '3': templateData[2],
    });

    console.log('Content Variables:', contentVariables);

    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      contentSid: contentSid,
      contentVariables: contentVariables,
    });
    console.log(`Template message sent to ${to}`, response);
  } catch (error) {
    console.error(`Failed to send WhatsApp template message to ${to}:`, error.message);
    console.error('Full error details:', error);
  }
};


const notifyDueTasks = async (phoneNumber, userName, dueTasks) => {
  if (!phoneNumber) {
    console.error('Phone number is undefined for due tasks notification.');
    return;
  }

  if (!Array.isArray(dueTasks)) {
    console.error('Expected an array for dueTasks, but received:', dueTasks);
    return;
  }

  try {
    const taskList = dueTasks
      .map(
        (task, index) =>
          `${index + 1}. *${task.title}*\n   - Description: ${
            task.description
          }\n   - Deadline: ${new Date(task.deadline).toLocaleDateString()}`
      )
      .join('\n\n');

    console.log('Generated Task List:', taskList);

    const templateData = [
      userName,     // For {{1}}
      taskList,     // For {{2}}
      'https://www.nirpekshnandan.com', // For {{3}}
    ];

    console.log('Template Data:', templateData);

    await sendWhatsAppTemplateMessage(
      phoneNumber,
      process.env.TWILIO_TEMPLATE_SID_NOTIFICATION,
      templateData
    );
    console.log(`Due tasks notification sent to ${phoneNumber}`);
  } catch (error) {
    console.error(`Error sending due task notification to ${phoneNumber}:`, error);
  }
};


const notifyOverdueTasks = async (phoneNumber, userName, overdueTasks) => {
  if (!phoneNumber) {
    console.error(
      'Phone number is undefined for overdue tasks notification.'
    );
    return;
  }

  if (!Array.isArray(overdueTasks)) {
    console.error(
      'Expected an array for overdueTasks, but received:',
      overdueTasks
    );
    return;
  }

  try {
    const taskMessages = overdueTasks
      .map(
        (task, index) =>
          `${index + 1}. *${task.title}*\n   - Description: ${
            task.description
          }\n   - Was due on: ${new Date(
            task.deadline
          ).toLocaleDateString()}`
      )
      .join('\n\n');

    console.log('Generated Task Messages:', taskMessages);

    const templateData = [
      userName, // For {{1}}
      taskMessages, // For {{2}}
      'https://www.nirpekshnandan.com', // For {{3}}
    ];

    console.log('Template Data:', templateData);

    await sendWhatsAppTemplateMessage(
      phoneNumber,
      process.env.TWILIO_TEMPLATE_SID_NOTIFICATION2,
      templateData
    );
    console.log(`Overdue tasks notification sent to ${phoneNumber}`);
  } catch (error) {
    console.error(
      `Error sending overdue task notification to ${phoneNumber}:`,
      error
    );
  }
};

module.exports = { notifyDueTasks, notifyOverdueTasks };
