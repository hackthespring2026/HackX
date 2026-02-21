const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, message, conversationId } = req.body;

    const newMessage = new Message({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      message
    });
    await newMessage.save();

    // Emit via socket
    const io = req.app.get('io');
    io.to(receiverId).emit('receiveMessage', {
      ...newMessage.toObject(),
      sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
    });

    res.status(201).json({ message: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a conversation
router.get('/:conversationId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { conversationId: req.params.conversationId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all conversations
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    res.json({ conversations: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
