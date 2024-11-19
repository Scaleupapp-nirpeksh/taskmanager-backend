const Notification = require('../models/Notification');

exports.createNotification = async (userId, type, message) => {
    try {
      const notification = new Notification({ user: userId, type, message });
      const savedNotification = await notification.save();
      console.log('Notification saved:', savedNotification); // Debugging log
      return savedNotification;
    } catch (error) {
      console.error('Error creating notification:', error.message);
    }
  };

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (!notification.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
