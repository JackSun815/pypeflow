import { supabase } from './supabase';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: 'success' | 'error' | 'warning';
}

export interface UserInfo {
  userId: string;
  email: string;
  role: string;
  agencyId: string;
}

class Logger {
  private userInfo: UserInfo | null = null;

  /**
   * Set the current user information for logging
   */
  setUserInfo(userInfo: UserInfo | null) {
    this.userInfo = userInfo;
  }

  /**
   * Log an audit trail entry
   */
  async audit(entry: AuditLogEntry): Promise<void> {
    try {
      if (!this.userInfo) {
        console.error('❌ AUDIT LOG ERROR: No user info set. Logger not initialized.');
        return;
      }

      // user_id must be UUID or NULL (for managers using localStorage, it will be NULL)
      // Check if userId is a valid UUID format, otherwise set to null
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.userInfo.userId);
      const userId = isValidUUID ? this.userInfo.userId : null;

      const auditLog = {
        user_id: userId,
        user_email: this.userInfo.email,
        user_role: this.userInfo.role,
        agency_id: this.userInfo.agencyId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        changes: entry.changes || null,
        old_values: entry.oldValues || null,
        new_values: entry.newValues || null,
        metadata: entry.metadata || null,
        status: entry.status || 'success',
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert(auditLog)
        .select();

      if (error) {
        console.error('❌ AUDIT LOG ERROR:', error);
      } else {
        console.log('✅ Audit log created:', entry.action, entry.entityType);
      }
    } catch (error) {
      console.error('❌ AUDIT LOG ERROR:', error);
    }
  }

  /**
   * Log a client-related action
   */
  async logClientAction(
    action: 'create' | 'update' | 'delete',
    clientId: string,
    changes?: Record<string, any>,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ) {
    await this.audit({
      action: `client_${action}`,
      entityType: 'client',
      entityId: clientId,
      changes,
      oldValues,
      newValues,
    });
  }

  /**
   * Log an assignment-related action
   */
  async logAssignmentAction(
    action: 'create' | 'update' | 'delete',
    assignmentId: string,
    changes?: Record<string, any>,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await this.audit({
      action: `assignment_${action}`,
      entityType: 'assignment',
      entityId: assignmentId,
      changes,
      oldValues,
      newValues,
      metadata,
    });
  }

  /**
   * Log a meeting-related action
   */
  async logMeetingAction(
    action: 'create' | 'update' | 'delete' | 'complete',
    meetingId: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await this.audit({
      action: `meeting_${action}`,
      entityType: 'meeting',
      entityId: meetingId,
      changes,
      metadata,
    });
  }

  /**
   * Log a user management action
   */
  async logUserAction(
    action: 'create' | 'update' | 'delete' | 'invite' | 'deactivate' | 'activate',
    userId: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await this.audit({
      action: `user_${action}`,
      entityType: 'user',
      entityId: userId,
      changes,
      metadata,
    });
  }

  /**
   * Log an authentication event
   */
  async logAuthAction(
    action: 'login' | 'logout' | 'password_reset' | 'session_refresh',
    metadata?: Record<string, any>
  ) {
    await this.audit({
      action: `auth_${action}`,
      entityType: 'auth',
      metadata,
    });
  }

  /**
   * Log an import/export action
   */
  async logDataAction(
    action: 'import' | 'export',
    entityType: string,
    metadata?: Record<string, any>
  ) {
    await this.audit({
      action: `data_${action}`,
      entityType,
      metadata,
    });
  }

  /**
   * Log an error
   */
  async logError(
    error: Error,
    context: string,
    metadata?: Record<string, any>
  ) {
    await this.audit({
      action: 'error',
      entityType: 'system',
      status: 'error',
      changes: {
        error: error.message,
        stack: error.stack,
        context,
      },
      metadata,
    });
  }

  /**
   * Log a bulk operation
   */
  async logBulkAction(
    action: string,
    entityType: string,
    affectedIds: string[],
    metadata?: Record<string, any>
  ) {
    await this.audit({
      action: `bulk_${action}`,
      entityType,
      changes: {
        affected_count: affectedIds.length,
        affected_ids: affectedIds,
      },
      metadata,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper function to calculate changes between old and new values
export function calculateChanges(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};
  
  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changes[key] = {
        old: oldValues[key],
        new: newValues[key],
      };
    }
  }
  
  return changes;
}
