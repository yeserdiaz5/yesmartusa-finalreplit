-- Add link field to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
