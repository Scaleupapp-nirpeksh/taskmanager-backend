// backend/services/whatsappNotification.js

const twilio = require('twilio');
const User = require('../models/User');
const Task = require('../models/Task');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_WHATSAPP = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

const sendWhatsAppTemplateMessage = async (to, contentSid) => {
  try {
    await client.messages.create({
      to: `whatsapp:${to}`,
      from: FROM_WHATSAPP,
      contentSid,  // Use contentSid here instead of messagingServiceSid
    });
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${to}: ${error.message}`);
  }
};


// Notify users with tasks due today
const notifyDueTasks = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find tasks due today and group by user
  const tasksDueToday = await Task.find({
    deadline: today,
    status: { $ne: 'Completed' }
  }).populate('assignedTo', 'name phone_number');

  const usersNotified = new Set();

  for (const task of tasksDueToday) {
    const user = task.assignedTo;
    if (user && !usersNotified.has(user._id)) {
      usersNotified.add(user._id);
      await sendWhatsAppTemplateMessage(user.phone_number, process.env.TWILIO_TEMPLATE_CONTENT_SID_NEW_DUE_TASKS);
    }
  }
};

// Notify users with overdue tasks
const notifyOverdueTasks = async () => {
  const today = new Date();

  const overdueTasks = await Task.find({
    deadline: { $lt: today },
    status: { $ne: 'Completed' }
  }).populate('assignedTo', 'name phone_number');

  const usersNotified = new Set();

  for (const task of overdueTasks) {
    const user = task.assignedTo;
    if (user && !usersNotified.has(user._id)) {
      usersNotified.add(user._id);
      await sendWhatsAppTemplateMessage(user.phone_number, process.env.TWILIO_TEMPLATE_CONTENT_SID_NEW_OVERDUE_TASKS);
    }
  }
};

module.exports = { notifyDueTasks, notifyOverdueTasks };


module.exports = { notifyDueTasks, notifyOverdueTasks };
