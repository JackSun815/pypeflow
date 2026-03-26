import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { 
  Filter, 
  Search, 
  AlertCircle, 
  ChevronDown,
  Clock,
  Loader2
} from 'lucide-react';

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

interface SDRAuditTrailProps {
  sdrId: string;
  darkTheme?: boolean;
}

export default function SDRAuditTrail({ sdrId, darkTheme = false }: SDRAuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [sdrNamesById, setSdrNamesById] = useState<Record<string, string>>({});
  const [clientNamesById, setClientNamesById] = useState<Record<string, string>>({});
  
  // Filter states
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 25;
  
  // Get unique values for filters
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  useEffect(() => {
    if (sdrId) {
      fetchLogs();
      fetchFilterOptions();
    }
  }, [sdrId, page, filterAction, filterEntityType, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    async function hydrateNamesForVisibleLogs() {
      if (logs.length === 0) return;

      const sdrIds = new Set<string>();
      const clientIds = new Set<string>();

      const captureIds = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value !== 'string') continue;
          if (key === 'sdr_id' || key === 'actor_id' || key === 'user_id') {
            sdrIds.add(value);
          }
          if (key === 'client_id') {
            clientIds.add(value);
          }
        }
      };

      for (const log of logs) {
        captureIds(log.metadata);
        captureIds(log.old_values);
        captureIds(log.new_values);
      }

      if (sdrIds.size > 0) {
        const ids = Array.from(sdrIds);
        const { data } = await supabase
          .from('profiles')
          .select('id,full_name')
          .in('id', ids);

        if (data) {
          const nextMap: Record<string, string> = {};
          for (const row of data as Array<{ id: string; full_name: string | null }>) {
            nextMap[row.id] = (row.full_name || '').trim() || 'Unknown SDR';
          }
          setSdrNamesById(prev => ({ ...prev, ...nextMap }));
        }
      }

      if (clientIds.size > 0) {
        const ids = Array.from(clientIds);
        const { data } = await supabase
          .from('clients')
          .select('id,name')
          .in('id', ids);

        if (data) {
          const nextMap: Record<string, string> = {};
          for (const row of data as Array<{ id: string; name: string }>) {
            nextMap[row.id] = row.name || 'Unknown Client';
          }
          setClientNamesById(prev => ({ ...prev, ...nextMap }));
        }
      }
    }

    hydrateNamesForVisibleLogs();
  }, [logs]);

  async function fetchFilterOptions() {
    if (!sdrId) return;
    
    try {
      // Fetch candidate actions, then filter in client for robustness.
      const baseQuery = supabase
        .from('audit_logs')
        .select('action, entity_type, user_id, metadata')
        .eq('user_role', 'sdr')
        .eq('entity_type', 'meeting')
        .in('action', ['meeting_create', 'meeting_update', 'meeting_delete'])
        .limit(500);
      
      const { data: logs, error: optionsError } = await baseQuery;
      if (optionsError) throw optionsError;
      
      if (logs) {
        const sdrLogs = logs.filter((log: any) => log.user_id === sdrId || log?.metadata?.sdr_id === sdrId);
        const actions = [...new Set(sdrLogs.map((l: any) => l.action))];
        setUniqueActions(actions);
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  }

  async function fetchLogs() {
    try {
      if (!sdrId) {
        setError('SDR information not available');
        return;
      }

      setLoading(true);
      setError(null);

      // Query candidate meeting logs, then restrict to this SDR in client-side filtering.
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_role', 'sdr')
        .eq('entity_type', 'meeting')
        .in('action', ['meeting_create', 'meeting_update', 'meeting_delete'])
        .order('created_at', { ascending: false })
        .limit(2000);

      // Apply date filters if set
      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Start with filtered logs from query.
      let filteredLogs = (data || []).filter((log: any) => log.user_id === sdrId || log?.metadata?.sdr_id === sdrId);

      // Apply action filter
      if (filterAction) {
        filteredLogs = filteredLogs.filter(log => log.action === filterAction);
      }

      // Apply entity type filter
      if (filterEntityType) {
        filteredLogs = filteredLogs.filter(log => log.entity_type === filterEntityType);
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.action?.toLowerCase().includes(searchLower) ||
          log.entity_type?.toLowerCase().includes(searchLower) ||
          log.user_email?.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.metadata || {}).toLowerCase().includes(searchLower) ||
          JSON.stringify(log.changes || {}).toLowerCase().includes(searchLower)
        );
      }

      // Handle pagination
      const totalCount = filteredLogs.length;
      const paginatedLogs = filteredLogs.slice(
        (page - 1) * pageSize,
        page * pageSize
      );

      setLogs(paginatedLogs);
      setTotalCount(totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilterAction('');
    setFilterEntityType('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  function formatActionLabel(action: string): string {
    if (action === 'meeting_create') return 'Added Meeting';
    if (action === 'meeting_update') return 'Edited Meeting / Status Changed';
    if (action === 'meeting_delete') return 'Deleted Meeting';
    return action;
  }

  function getActionBadgeColor(action: string): string {
    if (action.includes('create')) return darkTheme ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800';
    if (action.includes('update') || action.includes('edit')) return darkTheme ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
    if (action.includes('delete')) return darkTheme ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800';
    if (action.includes('assign')) return darkTheme ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800';
    if (action.includes('confirm')) return darkTheme ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800';
    return darkTheme ? 'bg-gray-800/30 text-gray-300' : 'bg-gray-100 text-gray-800';
  }

  function getStatusIcon(status: string) {
    if (status === 'success') return '✓';
    if (status === 'error') return '✗';
    if (status === 'warning') return '⚠';
    return '•';
  }

  function formatChangeValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  function formatFieldLabel(key: string): string {
    if (key === 'sdr_id' || key === 'actor_id' || key === 'user_id') return 'SDR';
    if (key === 'client_id') return 'Client';
    if (key === 'meeting_id') return 'Meeting';
    return key;
  }

  function formatFieldValue(key: string, value: any): string {
    if (typeof value === 'string' && value.trim() === '') return 'N/A';
    if (typeof value !== 'string') return formatChangeValue(value);

    if (key === 'sdr_id' || key === 'actor_id' || key === 'user_id') {
      const name = sdrNamesById[value];
      return name ? `${name} (${value})` : value;
    }

    if (key === 'client_id') {
      const name = clientNamesById[value];
      return name ? `${name} (${value})` : value;
    }

    return value;
  }

  function pickFirstNonEmptyValue(values: any[]): string | null {
    for (const value of values) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) return trimmed;
        continue;
      }
      return String(value);
    }
    return null;
  }

  function getActivitySummary(log: AuditLog): string[] {
    const contactName = pickFirstNonEmptyValue([
      log?.new_values?.contact_full_name,
      log?.old_values?.contact_full_name,
      log?.changes?.contact_full_name,
      log?.changes?.contact,
      log?.metadata?.contact_full_name,
      log?.metadata?.contact,
    ]);

    const company = pickFirstNonEmptyValue([
      log?.new_values?.company,
      log?.old_values?.company,
      log?.changes?.company,
      log?.metadata?.company,
    ]);

    const clientId = pickFirstNonEmptyValue([
      log?.new_values?.client_id,
      log?.old_values?.client_id,
      log?.metadata?.client_id,
    ]);

    const summary: string[] = [];
    if (contactName) summary.push(`Contact: ${contactName}`);
    if (company) summary.push(`Company: ${company}`);
    if (clientId) summary.push(`Client: ${formatFieldValue('client_id', clientId)}`);

    return summary;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={`${darkTheme ? 'bg-slate-900/50' : 'bg-white'} rounded-lg`}>
      {/* Header */}
      <div className={`mb-6 p-6 border-b ${darkTheme ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <Clock className={`w-6 h-6 ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-2xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Activities
          </h2>
        </div>
        <p className={darkTheme ? 'text-slate-400' : 'text-gray-600'}>
          Track your meeting actions: add, edit, delete, and status changes
        </p>
      </div>

      {/* Filters */}
      <div className={`mb-6 p-6 rounded-lg ${darkTheme ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className={`w-5 h-5 ${darkTheme ? 'text-slate-400' : 'text-gray-600'}`} />
          <h3 className={`font-semibold ${darkTheme ? 'text-slate-200' : 'text-gray-900'}`}>Filters</h3>
          {(filterAction || filterEntityType || searchTerm || dateFrom || dateTo) && (
            <button
              onClick={clearFilters}
              className={`ml-auto text-sm px-3 py-1 rounded transition-colors ${darkTheme ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`}
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              Search
            </label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Search actions, types..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  darkTheme 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                darkTheme 
                  ? 'bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              Type
            </label>
            <select
              value={filterEntityType}
              onChange={(e) => { setFilterEntityType(e.target.value); setPage(1); }}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                darkTheme 
                  ? 'bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              <option value="">Meeting</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                darkTheme 
                  ? 'bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            />
          </div>

          {/* Date To */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                darkTheme 
                  ? 'bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${darkTheme ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className={`w-5 h-5 ${darkTheme ? 'text-red-400' : 'text-red-600'}`} />
          <p className={darkTheme ? 'text-red-300' : 'text-red-700'}>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`w-8 h-8 animate-spin ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
      )}

      {/* Logs List */}
      {!loading && logs.length === 0 && (
        <div className={`text-center py-12 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
          <Clock className={`w-12 h-12 mx-auto mb-3 opacity-50 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
          <p>No activity found</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-3 px-6 pb-6">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                darkTheme
                  ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/70'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {/* Main Content */}
              <button
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                className="w-full text-left p-4 flex items-start gap-4 cursor-pointer"
              >
                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getActionBadgeColor(log.action)}`}>
                      {formatActionLabel(log.action)}
                    </span>
                    {log.status !== 'success' && (
                      <span className={`text-sm px-2 py-1 rounded ${
                        log.status === 'error'
                          ? darkTheme ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                          : darkTheme ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusIcon(log.status)} {log.status}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm mt-2 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                    <span className={`font-medium ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
                      {log.user_email}
                    </span>
                    {' • '}
                    {format(parseISO(log.created_at), 'MMM d, yyyy h:mm a')}
                  </p>

                  {/* Changes Preview */}
                  {getActivitySummary(log).length > 0 ? (
                    <p className={`text-sm mt-2 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
                      {getActivitySummary(log).join(' • ')}
                    </p>
                  ) : log.changes && Object.keys(log.changes).length > 0 ? (
                    <p className={`text-sm mt-2 ${darkTheme ? 'text-slate-400' : 'text-gray-600'}`}>
                      {Object.keys(log.changes).map(key => formatFieldValue(key, log.changes[key])).join(' • ')}
                    </p>
                  ) : null}
                </div>

                {/* Expand Icon */}
                <ChevronDown
                  className={`w-5 h-5 mt-1 flex-shrink-0 transition-transform ${
                    expandedLogId === log.id ? 'transform rotate-180' : ''
                  } ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`}
                />
              </button>

              {/* Expanded Details */}
              {expandedLogId === log.id && (
                <div className={`px-4 pb-4 border-t ${darkTheme ? 'border-slate-700' : 'border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Old Values */}
                    {log.old_values && Object.keys(log.old_values).length > 0 && (
                      <div>
                        <h4 className={`text-sm font-semibold mb-2 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
                          Previous Values
                        </h4>
                        <div className={`p-3 rounded text-sm space-y-1 ${darkTheme ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                          {Object.entries(log.old_values).map(([key, value]) => (
                            <div key={key} className={darkTheme ? 'text-slate-300' : 'text-gray-700'}>
                              <span className="font-medium">{formatFieldLabel(key)}:</span> {formatFieldValue(key, value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Values */}
                    {log.new_values && Object.keys(log.new_values).length > 0 && (
                      <div>
                        <h4 className={`text-sm font-semibold mb-2 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
                          New Values
                        </h4>
                        <div className={`p-3 rounded text-sm space-y-1 ${darkTheme ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                          {Object.entries(log.new_values).map(([key, value]) => (
                            <div key={key} className={darkTheme ? 'text-slate-300' : 'text-gray-700'}>
                              <span className="font-medium">{formatFieldLabel(key)}:</span> {formatFieldValue(key, value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="md:col-span-2">
                        <h4 className={`text-sm font-semibold mb-2 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
                          Additional Details
                        </h4>
                        <div className={`p-3 rounded text-sm space-y-1 ${darkTheme ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <div key={key} className={darkTheme ? 'text-slate-300' : 'text-gray-700'}>
                              <span className="font-medium">{formatFieldLabel(key)}:</span> {formatFieldValue(key, value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className={`flex items-center justify-center gap-4 py-6 border-t ${darkTheme ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg transition-colors ${
              page === 1
                ? darkTheme ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : darkTheme ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>

          <div className={`flex items-center gap-2 ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>
            <span>Page {page} of {totalPages}</span>
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg transition-colors ${
              page === totalPages
                ? darkTheme ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : darkTheme ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
