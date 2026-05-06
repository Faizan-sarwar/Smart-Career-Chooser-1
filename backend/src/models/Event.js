// backend/src/models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    host: { type: String, required: true },
    when: { type: Date, required: true },
    tag: {
      type: String,
      enum: ['Webinar', 'Workshop', 'AMA', 'Live', 'Networking', 'WEBINAR'],
      default: 'Webinar',
    },
    isLive: { type: Boolean, default: false },
    coverColor: { type: String, default: '#0d9488' },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '' },
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

eventSchema.virtual('attendees').get(function () {
  return this.rsvps?.length || 0;
});

eventSchema.set('toJSON', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;