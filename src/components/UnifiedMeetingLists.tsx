import React, { useState } from 'react';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Ban, ChevronDown, UserX, GripVertical } from 'lucide-react';
import type { Meeting } from '../types/database';
import { MeetingCard } from './MeetingCard';

interface UnifiedMeetingListsProps {
  editable?: boolean;
  editingMeetingId?: string | null;
  onEdit?: (meeting: Meeting) => void;
  onSave?: (meeting: Meeting) => void;
  onCancel?: () => void;
  pendingMeetings: Meeting[];
  confirmedMeetings: Meeting[];
  heldMeetings: Meeting[];
  noShowMeetings: Meeting[];
  notIcpQualifiedMeetings?: Meeting[];
  noLongerInterestedMeetings?: Meeting[];
  onDelete?: (meetingId: string) => void;
  onUpdateHeldDate?: (meetingId: string, heldDate: string | null) => void;
  onUpdateConfirmedDate?: (meetingId: string, confirmedDate: string | null) => void;
  onMeetingStatusChange?: (meetingId: string, newStatus: 'pending' | 'confirmed' | 'held' | 'no-show') => void;
  darkTheme?: boolean;
}

export default function UnifiedMeetingLists({
  pendingMeetings,
  confirmedMeetings,
  heldMeetings,
  noShowMeetings,
  notIcpQualifiedMeetings = [],
  noLongerInterestedMeetings = [],
  pastDuePendingMeetings = [], // Add this prop for Past Due Pending
  onDelete,
  onUpdateHeldDate,
  onUpdateConfirmedDate,
  onMeetingStatusChange,
  editable = false,
  editingMeetingId = null,
  onEdit,
  onSave,
  onCancel,
  darkTheme = false,
}: UnifiedMeetingListsProps & { pastDuePendingMeetings?: Meeting[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedMeeting, setDraggedMeeting] = useState<Meeting | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    pending: true,
    confirmed: true,
    pastDue: true,
    held: true,
    noShow: true,
    notIcp: true,
    noLongerInterested: true,
  });
  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Drag and drop handlers
  const handleDragStart = (meeting: Meeting) => {
    setDraggedMeeting(meeting);
  };

  const handleDragEnd = () => {
    setDraggedMeeting(null);
    setDragOverSection(null);
  };

  const handleDragOver = (e: React.DragEvent, section: string) => {
    e.preventDefault();
    setDragOverSection(section);
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'pending' | 'confirmed' | 'held' | 'no-show') => {
    e.preventDefault();
    if (draggedMeeting && onMeetingStatusChange) {
      onMeetingStatusChange(draggedMeeting.id, targetStatus);
    }
    setDraggedMeeting(null);
    setDragOverSection(null);
  };

  const filterMeetings = (meetings: Meeting[]) => {
    return meetings.filter(meeting => {
      const searchString = `${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  };

  const filteredPendingMeetings = filterMeetings(pendingMeetings);
  const filteredConfirmedMeetings = filterMeetings(confirmedMeetings);
  const filteredHeldMeetings = filterMeetings(heldMeetings);
  const filteredNoShowMeetings = filterMeetings(noShowMeetings);
  const filteredNotIcpQualifiedMeetings = filterMeetings(notIcpQualifiedMeetings);
  const filteredNoLongerInterestedMeetings = filterMeetings(noLongerInterestedMeetings);
  // Add filteredPastDuePendingMeetings
  const filteredPastDuePendingMeetings = filterMeetings(pastDuePendingMeetings);

  const MeetingList = ({ title, meetings }: { title: string; meetings: Meeting[] }) => (
    <div className={`rounded-lg shadow-md ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
      <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{title}</h3>
          <span className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>{meetings.length} meetings</span>
        </div>
      </div>
      <div className="p-4 max-h-[800px] overflow-y-auto">
        <div className="space-y-4">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onDelete={onDelete}
                onUpdateHeldDate={onUpdateHeldDate}
                onUpdateConfirmedDate={onUpdateConfirmedDate}
                editable={editable}
                editingMeetingId={editingMeetingId}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                showDateControls={true}
                darkTheme={darkTheme}
              />
            ))
          ) : (
            <p className={`text-sm text-center ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No meetings to display</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className={`rounded-lg shadow-md p-4 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search all meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'
            }`}
          />
          <Search className={`absolute left-3 top-3.5 w-5 h-5 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
        </div>
      </div>

      {/* Pending, Confirmed, Past Due Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Meetings */}
        <div 
          className={`${darkTheme ? 'bg-[#232529]' : 'bg-white'} rounded-lg shadow-md border-t-4 border-yellow-400 transition-all ${dragOverSection === 'pending' ? (darkTheme ? 'ring-4 ring-yellow-600 bg-yellow-900/20' : 'ring-4 ring-yellow-300 bg-yellow-50') : ''}`}
          onDragOver={(e) => handleDragOver(e, 'pending')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'pending')}
        >
          <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139] bg-yellow-900/10' : 'border-gray-200 bg-yellow-50'} flex items-center gap-2 cursor-pointer select-none`} onClick={() => toggleSection('pending')}>
            <Clock className="w-5 h-5 text-yellow-500" />
            <h3 className={`text-lg font-semibold flex-1 ${darkTheme ? 'text-yellow-200' : 'text-yellow-800'}`}>Pending Meetings</h3>
            <span className={`text-sm ${darkTheme ? 'text-yellow-300' : 'text-yellow-600'}`}>{filteredPendingMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${darkTheme ? 'text-yellow-300' : ''} ${openSections.pending ? '' : 'rotate-180'}`} />
          </div>
          {openSections.pending && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredPendingMeetings.length > 0 ? (
                filteredPendingMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className={`mb-4 border rounded-lg shadow-sm hover:shadow-lg transition-all relative group ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''} ${darkTheme ? 'border-yellow-800/30 bg-[#1d1f24]' : 'border-yellow-100 bg-white'}`}
                  >
                    <div
                      draggable
                      onDragStart={() => handleDragStart(meeting)}
                      onDragEnd={handleDragEnd}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1 rounded-r z-10 ${darkTheme ? 'bg-[#2d3139] hover:bg-[#3a3f47]' : 'bg-gray-100 hover:bg-gray-200'}`}
                      title="Drag to move"
                    >
                      <GripVertical className={`w-3 h-3 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`} />
                    </div>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center py-8 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                  {dragOverSection === 'pending' ? 'Drop here to mark as Pending' : 'No meetings to display'}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Confirmed Meetings */}
        <div 
          className={`${darkTheme ? 'bg-[#232529]' : 'bg-white'} rounded-lg shadow-md border-t-4 border-blue-400 transition-all ${dragOverSection === 'confirmed' ? (darkTheme ? 'ring-4 ring-blue-600 bg-blue-900/20' : 'ring-4 ring-blue-300 bg-blue-50') : ''}`}
          onDragOver={(e) => handleDragOver(e, 'confirmed')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'confirmed')}
        >
          <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139] bg-blue-900/10' : 'border-gray-200 bg-blue-50'} flex items-center gap-2 cursor-pointer select-none`} onClick={() => toggleSection('confirmed')}>
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <h3 className={`text-lg font-semibold flex-1 ${darkTheme ? 'text-blue-200' : 'text-blue-800'}`}>Confirmed Meetings</h3>
            <span className={`text-sm ${darkTheme ? 'text-blue-300' : 'text-blue-600'}`}>{filteredConfirmedMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${darkTheme ? 'text-blue-300' : ''} ${openSections.confirmed ? '' : 'rotate-180'}`} />
          </div>
          {openSections.confirmed && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredConfirmedMeetings.length > 0 ? (
                filteredConfirmedMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className={`mb-4 border rounded-lg shadow-sm hover:shadow-lg transition-all relative group ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''} ${darkTheme ? 'border-blue-800/30 bg-[#1d1f24]' : 'border-blue-100 bg-white'}`}
                  >
                    <div
                      draggable
                      onDragStart={() => handleDragStart(meeting)}
                      onDragEnd={handleDragEnd}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1 rounded-r z-10 ${darkTheme ? 'bg-[#2d3139] hover:bg-[#3a3f47]' : 'bg-gray-100 hover:bg-gray-200'}`}
                      title="Drag to move"
                    >
                      <GripVertical className={`w-3 h-3 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`} />
                    </div>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center py-8 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                  {dragOverSection === 'confirmed' ? 'Drop here to mark as Confirmed' : 'No meetings to display'}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Past Due Pending */}
        <div className={`${darkTheme ? 'bg-[#232529]' : 'bg-white'} rounded-lg shadow-md border-t-4 border-orange-400`}>
          <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139] bg-orange-900/10' : 'border-gray-200 bg-orange-50'} flex items-center gap-2 cursor-pointer select-none`} onClick={() => toggleSection('pastDue')}>
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h3 className={`text-lg font-semibold flex-1 ${darkTheme ? 'text-orange-200' : 'text-orange-800'}`}>Past Due Pending</h3>
            <span className={`text-sm ${darkTheme ? 'text-orange-300' : 'text-orange-600'}`}>{filteredPastDuePendingMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${darkTheme ? 'text-orange-300' : ''} ${openSections.pastDue ? '' : 'rotate-180'}`} />
          </div>
          {openSections.pastDue && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredPastDuePendingMeetings.length > 0 ? (
                filteredPastDuePendingMeetings.map((meeting) => (
                  <div key={meeting.id} className={`mb-4 border rounded-lg shadow-sm hover:shadow-lg transition-shadow ${darkTheme ? 'border-orange-800/30 bg-[#1d1f24]' : 'border-orange-100 bg-white'}`}>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No meetings to display</p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Held Meetings and No Shows - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Held Meetings */}
        <div 
          className={`${darkTheme ? 'bg-[#232529]' : 'bg-white'} rounded-lg shadow-md border-t-4 border-green-400 transition-all ${dragOverSection === 'held' ? (darkTheme ? 'ring-4 ring-green-600 bg-green-900/20' : 'ring-4 ring-green-300 bg-green-50') : ''}`}
          onDragOver={(e) => handleDragOver(e, 'held')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'held')}
        >
          <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139] bg-green-900/10' : 'border-gray-200 bg-green-50'} flex items-center gap-2 cursor-pointer select-none`} onClick={() => toggleSection('held')}>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className={`text-lg font-semibold flex-1 ${darkTheme ? 'text-green-200' : 'text-green-800'}`}>Held Meetings</h3>
            <span className={`text-sm ${darkTheme ? 'text-green-300' : 'text-green-600'}`}>{filteredHeldMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${darkTheme ? 'text-green-300' : ''} ${openSections.held ? '' : 'rotate-180'}`} />
          </div>
          {openSections.held && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredHeldMeetings.length > 0 ? (
                filteredHeldMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className={`mb-4 border rounded-lg shadow-sm hover:shadow-lg transition-all relative group ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''} ${darkTheme ? 'border-green-800/30 bg-[#1d1f24]' : 'border-green-100 bg-white'}`}
                  >
                    <div
                      draggable
                      onDragStart={() => handleDragStart(meeting)}
                      onDragEnd={handleDragEnd}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1 rounded-r z-10 ${darkTheme ? 'bg-[#2d3139] hover:bg-[#3a3f47]' : 'bg-gray-100 hover:bg-gray-200'}`}
                      title="Drag to move"
                    >
                      <GripVertical className={`w-3 h-3 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`} />
                    </div>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center py-8 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                  {dragOverSection === 'held' ? 'Drop here to mark as Held' : 'No meetings to display'}
                </p>
              )}
            </div>
          )}
        </div>
        {/* No Shows */}
        <div 
          className={`${darkTheme ? 'bg-[#232529]' : 'bg-white'} rounded-lg shadow-md border-t-4 border-red-400 transition-all ${dragOverSection === 'noShow' ? (darkTheme ? 'ring-4 ring-red-600 bg-red-900/20' : 'ring-4 ring-red-300 bg-red-50') : ''}`}
          onDragOver={(e) => handleDragOver(e, 'noShow')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'no-show')}
        >
          <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139] bg-red-900/10' : 'border-gray-200 bg-red-50'} flex items-center gap-2 cursor-pointer select-none`} onClick={() => toggleSection('noShow')}>
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className={`text-lg font-semibold flex-1 ${darkTheme ? 'text-red-200' : 'text-red-800'}`}>No Shows</h3>
            <span className={`text-sm ${darkTheme ? 'text-red-300' : 'text-red-600'}`}>{filteredNoShowMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${darkTheme ? 'text-red-300' : ''} ${openSections.noShow ? '' : 'rotate-180'}`} />
          </div>
          {openSections.noShow && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredNoShowMeetings.length > 0 ? (
                filteredNoShowMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className={`mb-4 border rounded-lg shadow-sm hover:shadow-lg transition-all relative group ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''} ${darkTheme ? 'border-red-800/30 bg-[#1d1f24]' : 'border-red-100 bg-white'}`}
                  >
                    <div
                      draggable
                      onDragStart={() => handleDragStart(meeting)}
                      onDragEnd={handleDragEnd}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1 rounded-r z-10 ${darkTheme ? 'bg-[#2d3139] hover:bg-[#3a3f47]' : 'bg-gray-100 hover:bg-gray-200'}`}
                      title="Drag to move"
                    >
                      <GripVertical className={`w-3 h-3 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`} />
                    </div>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center py-8 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                  {dragOverSection === 'noShow' ? 'Drop here to mark as No Show' : 'No meetings to display'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* No Longer Interested and Not ICP Qualified - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* No Longer Interested */}
        <div className={`${darkTheme ? 'bg-[#232529]' : 'bg-white'} rounded-lg shadow-md border-t-4 border-purple-400`}>
          <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139] bg-purple-900/10' : 'border-gray-200 bg-purple-50'} flex items-center gap-2 cursor-pointer select-none`} onClick={() => toggleSection('noLongerInterested')}>
            <UserX className="w-5 h-5 text-purple-500" />
            <h3 className={`text-lg font-semibold flex-1 ${darkTheme ? 'text-purple-200' : 'text-purple-800'}`}>No Longer Interested</h3>
            <span className={`text-sm ${darkTheme ? 'text-purple-300' : 'text-purple-600'}`}>{filteredNoLongerInterestedMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${darkTheme ? 'text-purple-300' : ''} ${openSections.noLongerInterested ? '' : 'rotate-180'}`} />
          </div>
          {openSections.noLongerInterested && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredNoLongerInterestedMeetings.length > 0 ? (
                filteredNoLongerInterestedMeetings.map((meeting) => (
                  <div key={meeting.id} className={`mb-4 border rounded-lg shadow-sm hover:shadow-lg transition-shadow ${darkTheme ? 'border-purple-800/30 bg-[#1d1f24]' : 'border-purple-100 bg-white'}`}>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No meetings to display</p>
              )}
            </div>
          )}
        </div>
        {/* Not ICP Qualified */}
        <div className={`${darkTheme ? 'bg-[#232529]' : 'bg-white'} rounded-lg shadow-md border-t-4 border-gray-400`}>
          <div className={`p-4 border-b ${darkTheme ? 'border-[#2d3139] bg-slate-800/50' : 'border-gray-200 bg-gray-50'} flex items-center gap-2 cursor-pointer select-none`} onClick={() => toggleSection('notIcp')}>
            <Ban className={`w-5 h-5 ${darkTheme ? 'text-slate-400' : 'text-gray-700'}`} />
            <h3 className={`text-lg font-semibold flex-1 ${darkTheme ? 'text-slate-200' : 'text-gray-800'}`}>Not ICP Qualified</h3>
            <span className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-600'}`}>{filteredNotIcpQualifiedMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${darkTheme ? 'text-slate-400' : ''} ${openSections.notIcp ? '' : 'rotate-180'}`} />
          </div>
          {openSections.notIcp && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredNotIcpQualifiedMeetings.length > 0 ? (
                filteredNotIcpQualifiedMeetings.map((meeting) => (
                  <div key={meeting.id} className={`mb-4 border rounded-lg shadow-sm hover:shadow-lg transition-shadow ${darkTheme ? 'border-[#2d3139] bg-[#1d1f24]' : 'border-gray-200 bg-white'}`}>
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No meetings to display</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}