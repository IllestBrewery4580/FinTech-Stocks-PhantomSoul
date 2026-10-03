import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    action: {
      type: String,
      required: true,
    },

    resource: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    details: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

export const recordAudit = async ({
  userId = null,
  action,
  resource = null,
  ipAddress = null,
  details = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      ipAddress,
      details,
    });
  } catch (error) {
    // Audit failures should be logged, but should not crash
    // the main application request.
    console.error('[AUDIT LOG ERROR]:', error.message);
  }
};

export default AuditLog;
