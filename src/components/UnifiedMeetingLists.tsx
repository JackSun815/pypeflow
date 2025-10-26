import React, { useState } from 'react';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Ban, ChevronDown, UserX } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">{meetings.length} meetings</span>
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
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">No meetings to display</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search all meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Pending, Confirmed, Past Due Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Meetings */}
        <div 
          className={`bg-white rounded-lg shadow-md border-t-4 border-yellow-400 transition-all ${dragOverSection === 'pending' ? 'ring-4 ring-yellow-300 bg-yellow-50' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'pending')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'pending')}
        >
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-yellow-50 cursor-pointer select-none" onClick={() => toggleSection('pending')}>
            <Clock className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-yellow-800 flex-1">Pending Meetings</h3>
            <span className="text-sm text-yellow-600">{filteredPendingMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${openSections.pending ? '' : 'rotate-180'}`} />
          </div>
          {openSections.pending && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredPendingMeetings.length > 0 ? (
                filteredPendingMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    draggable
                    onDragStart={() => handleDragStart(meeting)}
                    onDragEnd={handleDragEnd}
                    className={`mb-4 border border-yellow-100 rounded-lg bg-white shadow-sm hover:shadow-lg transition-all cursor-move ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''}`}
                  >
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
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  {dragOverSection === 'pending' ? 'Drop here to mark as Pending' : 'No meetings to display'}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Confirmed Meetings */}
        <div 
          className={`bg-white rounded-lg shadow-md border-t-4 border-blue-400 transition-all ${dragOverSection === 'confirmed' ? 'ring-4 ring-blue-300 bg-blue-50' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'confirmed')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'confirmed')}
        >
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-blue-50 cursor-pointer select-none" onClick={() => toggleSection('confirmed')}>
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-blue-800 flex-1">Confirmed Meetings</h3>
            <span className="text-sm text-blue-600">{filteredConfirmedMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${openSections.confirmed ? '' : 'rotate-180'}`} />
          </div>
          {openSections.confirmed && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredConfirmedMeetings.length > 0 ? (
                filteredConfirmedMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    draggable
                    onDragStart={() => handleDragStart(meeting)}
                    onDragEnd={handleDragEnd}
                    className={`mb-4 border border-blue-100 rounded-lg bg-white shadow-sm hover:shadow-lg transition-all cursor-move ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''}`}
                  >
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
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  {dragOverSection === 'confirmed' ? 'Drop here to mark as Confirmed' : 'No meetings to display'}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Past Due Pending */}
        <div className="bg-white rounded-lg shadow-md border-t-4 border-orange-400">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-orange-50 cursor-pointer select-none" onClick={() => toggleSection('pastDue')}>
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-orange-800 flex-1">Past Due Pending</h3>
            <span className="text-sm text-orange-600">{filteredPastDuePendingMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${openSections.pastDue ? '' : 'rotate-180'}`} />
          </div>
          {openSections.pastDue && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredPastDuePendingMeetings.length > 0 ? (
                filteredPastDuePendingMeetings.map((meeting) => (
                  <div key={meeting.id} className="mb-4 border border-orange-100 rounded-lg bg-white shadow-sm hover:shadow-lg transition-shadow">
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
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">No meetings to display</p>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Held Meetings and No Shows - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Held Meetings */}
        <div 
          className={`bg-white rounded-lg shadow-md border-t-4 border-green-400 transition-all ${dragOverSection === 'held' ? 'ring-4 ring-green-300 bg-green-50' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'held')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'held')}
        >
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-green-50 cursor-pointer select-none" onClick={() => toggleSection('held')}>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-green-800 flex-1">Held Meetings</h3>
            <span className="text-sm text-green-600">{filteredHeldMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${openSections.held ? '' : 'rotate-180'}`} />
          </div>
          {openSections.held && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredHeldMeetings.length > 0 ? (
                filteredHeldMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    draggable
                    onDragStart={() => handleDragStart(meeting)}
                    onDragEnd={handleDragEnd}
                    className={`mb-4 border border-green-100 rounded-lg bg-white shadow-sm hover:shadow-lg transition-all cursor-move ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''}`}
                  >
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
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  {dragOverSection === 'held' ? 'Drop here to mark as Held' : 'No meetings to display'}
                </p>
              )}
            </div>
          )}
        </div>
        {/* No Shows */}
        <div 
          className={`bg-white rounded-lg shadow-md border-t-4 border-red-400 transition-all ${dragOverSection === 'noShow' ? 'ring-4 ring-red-300 bg-red-50' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'noShow')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'no-show')}
        >
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-red-50 cursor-pointer select-none" onClick={() => toggleSection('noShow')}>
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800 flex-1">No Shows</h3>
            <span className="text-sm text-red-600">{filteredNoShowMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${openSections.noShow ? '' : 'rotate-180'}`} />
          </div>
          {openSections.noShow && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredNoShowMeetings.length > 0 ? (
                filteredNoShowMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    draggable
                    onDragStart={() => handleDragStart(meeting)}
                    onDragEnd={handleDragEnd}
                    className={`mb-4 border border-red-100 rounded-lg bg-white shadow-sm hover:shadow-lg transition-all cursor-move ${draggedMeeting?.id === meeting.id ? 'opacity-50' : ''}`}
                  >
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
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
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
        <div className="bg-white rounded-lg shadow-md border-t-4 border-purple-400">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-purple-50 cursor-pointer select-none" onClick={() => toggleSection('noLongerInterested')}>
            <UserX className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-purple-800 flex-1">No Longer Interested</h3>
            <span className="text-sm text-purple-600">{filteredNoLongerInterestedMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${openSections.noLongerInterested ? '' : 'rotate-180'}`} />
          </div>
          {openSections.noLongerInterested && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredNoLongerInterestedMeetings.length > 0 ? (
                filteredNoLongerInterestedMeetings.map((meeting) => (
                  <div key={meeting.id} className="mb-4 border border-purple-100 rounded-lg bg-white shadow-sm hover:shadow-lg transition-shadow">
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
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">No meetings to display</p>
              )}
            </div>
          )}
        </div>
        {/* Not ICP Qualified */}
        <div className="bg-white rounded-lg shadow-md border-t-4 border-gray-400">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50 cursor-pointer select-none" onClick={() => toggleSection('notIcp')}>
            <Ban className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800 flex-1">Not ICP Qualified</h3>
            <span className="text-sm text-gray-600">{filteredNotIcpQualifiedMeetings.length}</span>
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${openSections.notIcp ? '' : 'rotate-180'}`} />
          </div>
          {openSections.notIcp && (
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredNotIcpQualifiedMeetings.length > 0 ? (
                filteredNotIcpQualifiedMeetings.map((meeting) => (
                  <div key={meeting.id} className="mb-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-lg transition-shadow">
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
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">No meetings to display</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}