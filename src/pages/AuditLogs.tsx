import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../contexts/AgencyContext';
import { format } from 'date-fns';
import { FileText, Filter, Download, Search, AlertCircle } from 'lucide-react';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: any;
  old_values: any;
  new_values: any;
  metadata: any;
  status: 'success' | 'error' | 'warning';
}

export default function AuditLogs() {
  const { agency } = useAgency();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;
  
  // Get unique values for filters
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  const [uniqueEntityTypes, setUniqueEntityTypes] = useState<string[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchFilterOptions();
  }, [agency?.id, page, filterAction, filterEntityType, filterUser, filterStatus, dateFrom, dateTo]);

  async function fetchFilterOptions() {
    if (!agency?.id) return;
    
    try {
      // Get unique actions
      const { data: actionsData } = await supabase
        .from('audit_logs')
        .select('action')
        .eq('agency_id', agency.id)
        .order('action');
      
      const actions = [...new Set((actionsData || []).map(l => l.action))];
      setUniqueActions(actions);
      
      // Get unique entity types
      const { data: entitiesData } = await supabase
        .from('audit_logs')
        .select('entity_type')
        .eq('agency_id', agency.id)
        .order('entity_type');
      
      const entities = [...new Set((entitiesData || []).map(l => l.entity_type))];
      setUniqueEntityTypes(entities);
      
      // Get unique users
      const { data: usersData } = await supabase
        .from('audit_logs')
        .select('user_email')
        .eq('agency_id', agency.id)
        .order('user_email');
      
      const users = [...new Set((usersData || []).map(l => l.user_email))];
      setUniqueUsers(users);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  }

  async function fetchLogs() {
    try {
      if (!agency?.id) {
        setError('Agency information not available');
        return;
      }

      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (filterAction) {
        query = query.eq('action', filterAction);
      }
      if (filterEntityType) {
        query = query.eq('entity_type', filterEntityType);
      }
      if (filterUser) {
        query = query.eq('user_email', filterUser);
      }
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilterAction('');
    setFilterEntityType('');
    setFilterUser('');
    setFilterStatus('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  async function exportLogs() {
    try {
      // Fetch all logs matching current filters (without pagination)
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('agency_id', agency?.id)
        .order('created_at', { ascending: false });

      // Apply same filters as display
      if (filterAction) query = query.eq('action', filterAction);
      if (filterEntityType) query = query.eq('entity_type', filterEntityType);
      if (filterUser) query = query.eq('user_email', filterUser);
      if (filterStatus) query = query.eq('status', filterStatus);
      if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Prepare CSV
      const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Status', 'Changes'];
      const rows = (data || []).map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_email,
        log.user_role,
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.status,
        JSON.stringify(log.changes || {})
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            const value = String(cell);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
    }
  }

  function getActionColor(action: string): string {
    if (action.includes('create')) return 'text-green-600';
    if (action.includes('update')) return 'text-blue-600';
    if (action.includes('delete')) return 'text-red-600';
    if (action.includes('error')) return 'text-red-700';
    if (action.includes('login') || action.includes('auth')) return 'text-purple-600';
    return 'text-gray-600';
  }

  function getStatusBadge(status: string) {
    const colors = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || colors.success;
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-8 h-8" />
                Audit Logs
              </h1>
              <p className="text-gray-600 mt-1">
                Complete audit trail of all actions in your agency
              </p>
            </div>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {uniqueEntityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredLogs.length} of {totalCount} logs
          {(filterAction || filterEntityType || filterUser || filterStatus || dateFrom || dateTo || searchTerm) && 
            ' (filtered)'}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.user_email}</div>
                        <div className="text-xs text-gray-500">{log.user_role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.entity_type}</div>
                        {log.metadata?.client_name ? (
                          <div className="text-xs text-gray-700 font-medium">{log.metadata.client_name}</div>
                        ) : log.entity_id ? (
                          <div className="text-xs text-gray-500 font-mono">{log.entity_id.slice(0, 8)}...</div>
                        ) : null}
                        {log.metadata?.sdr_name && (
                          <div className="text-xs text-blue-600">→ {log.metadata.sdr_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(log.changes && Object.keys(log.changes).length > 0) || 
                         (log.old_values && Object.keys(log.old_values).length > 0) ||
                         (log.new_values && Object.keys(log.new_values).length > 0) ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-700">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                              {JSON.stringify({
                                ...(log.changes || {}),
                                ...(log.old_values ? { old: log.old_values } : {}),
                                ...(log.new_values ? { new: log.new_values } : {})
                              }, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
