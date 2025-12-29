-- Phase 4: Add indexes for efficient notification cleanup

-- Index on created_at for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at);

-- Composite index for fetching user notifications efficiently
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- Index for unread notification counts
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read) WHERE read = false;