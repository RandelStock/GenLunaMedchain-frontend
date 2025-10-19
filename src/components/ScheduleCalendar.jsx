import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Plus, X, Download, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// Mock API - Replace with your actual API
const mockApi = {
  get: async (url) => ({ data: { data: [] } }),
  post: async (url, data) => ({ data: { success: true, event_id: Date.now() } }),
  put: async (url, data) => ({ data: { success: true } }),
  delete: async (url) => ({ data: { success: true } })
};

const CENTER_COLORS = { RHU: '#3b82f6', BARANGAY: '#10b981' };
const BARANGAY_COLORS = {
  'BACONG_IBABA': '#ef4444', 'BACONG_ILAYA': '#f97316', 'BARANGAY_1_POBLACION': '#f59e0b',
  'BARANGAY_2_POBLACION': '#eab308', 'BARANGAY_3_POBLACION': '#84cc16', 'BARANGAY_4_POBLACION': '#22c55e',
  'BARANGAY_5_POBLACION': '#10b981', 'BARANGAY_6_POBLACION': '#14b8a6', 'BARANGAY_7_POBLACION': '#06b6d4',
  'BARANGAY_8_POBLACION': '#0ea5e9', 'BARANGAY_9_POBLACION': '#3b82f6', 'LAVIDES': '#6366f1',
  'MAGSAYSAY': '#8b5cf6', 'MALAYA': '#a855f7', 'NIEVA': '#c026d3', 'RECTO': '#d946ef',
  'SAN_IGNACIO_IBABA': '#ec4899', 'SAN_IGNACIO_ILAYA': '#f43f5e', 'SAN_ISIDRO_IBABA': '#fb7185',
  'SAN_ISIDRO_ILAYA': '#fb923c', 'SAN_JOSE': '#fbbf24', 'SAN_NICOLAS': '#a3e635', 'SAN_VICENTE': '#4ade80',
  'SANTA_MARIA_IBABA': '#2dd4bf', 'SANTA_MARIA_ILAYA': '#22d3ee', 'SUMILANG': '#38bdf8',
  'VILLARICA': '#818cf8', 'MUNICIPAL': '#6b7280'
};
const BARANGAYS = Object.keys(BARANGAY_COLORS);

export default function ScheduleCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filters, setFilters] = useState({ barangay: '', center_type: '' });
  const [colorMode, setColorMode] = useState('center');
  const [loading, setLoading] = useState(false);
  const isAdmin = true;
  const [formData, setFormData] = useState({
    title: '', description: '', start_time: '', end_time: '',
    barangay: '', center_type: 'RHU', location: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.barangay) params.append('barangay', filters.barangay);
      if (filters.center_type) params.append('center_type', filters.center_type);
      const { data } = await mockApi.get(`/schedule?${params.toString()}`);
      setEvents(data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.barangay, filters.center_type]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const days = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const getEventsForDay = (day) => {
    const dayStr = day.toISOString().split('T')[0];
    return events.filter(e => new Date(e.start_time).toISOString().split('T')[0] === dayStr);
  };

  const getEventColor = (event) => {
    return colorMode === 'barangay' 
      ? (BARANGAY_COLORS[event.barangay] || '#6b7280')
      : (CENTER_COLORS[event.center_type] || '#3b82f6');
  };

  const openModal = (date = null, event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title, description: event.description || '',
        start_time: new Date(event.start_time).toISOString().slice(0, 16),
        end_time: new Date(event.end_time).toISOString().slice(0, 16),
        barangay: event.barangay, center_type: event.center_type, location: event.location || ''
      });
    } else if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setFormData({
        title: '', description: '', start_time: `${dateStr}T09:00`, end_time: `${dateStr}T10:00`,
        barangay: '', center_type: 'RHU', location: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({ title: '', description: '', start_time: '', end_time: '', barangay: '', center_type: 'RHU', location: '' });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.start_time || !formData.end_time || !formData.barangay) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      if (editingEvent) {
        await mockApi.put(`/schedule/${editingEvent.event_id}`, formData);
        setEvents(events.map(ev => ev.event_id === editingEvent.event_id ? { ...ev, ...formData } : ev));
      } else {
        const { data } = await mockApi.post('/schedule', formData);
        setEvents([...events, { ...formData, event_id: data.event_id }]);
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save event', err);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await mockApi.delete(`/schedule/${eventId}`);
      setEvents(events.filter(e => e.event_id !== eventId));
      closeModal();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const exportICS = () => {
    const icsEvents = events.map(e => {
      const start = new Date(e.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(e.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return `BEGIN:VEVENT\nUID:${e.event_id}@schedule.local\nDTSTAMP:${start}\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${e.title}\nDESCRIPTION:${e.description || ''}\nLOCATION:${e.location || e.barangay}\nEND:VEVENT`;
    }).join('\n');
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Schedule Calendar//EN\n${icsEvents}\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isToday = (day) => day.toDateString() === new Date().toDateString();
  const isCurrentMonth = (day) => day.getMonth() === currentDate.getMonth();

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700 font-medium">
              Today
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={exportICS} className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50 text-gray-700 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            {isAdmin && (
              <button onClick={() => openModal(new Date())} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                <Plus className="w-4 h-4" />
                New Event
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Center Type</label>
            <select value={filters.center_type} onChange={(e)=>setFilters(f=>({...f,center_type:e.target.value}))} className="border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white font-medium">
              <option value="">All</option>
              <option value="RHU">RHU</option>
              <option value="BARANGAY">Barangay</option>
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Barangay</label>
              <select value={filters.barangay} onChange={(e)=>setFilters(f=>({...f,barangay:e.target.value}))} className="border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white font-medium">
                <option value="">All</option>
                {BARANGAYS.map(b => <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Color By</label>
            <select value={colorMode} onChange={(e)=>setColorMode(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white font-medium">
              <option value="center">Center Type</option>
              <option value="barangay">Barangay</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-800 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isTodayDay = isToday(day);
            const isCurrentMonthDay = isCurrentMonth(day);

            return (
              <div
                key={idx}
                className={`min-h-32 border-b border-r last:border-r-0 p-2 transition ${
                  !isCurrentMonthDay ? 'bg-gray-50/50' : 'bg-white'
                } ${isTodayDay ? 'bg-blue-50' : ''} ${isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={() => isAdmin && openModal(day)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isTodayDay ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 
                  isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.event_id}
                      className="text-xs p-1.5 rounded text-white truncate cursor-pointer hover:opacity-80 shadow-sm"
                      style={{ backgroundColor: getEventColor(event) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(null, event);
                      }}
                      title={event.title}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-[10px] opacity-90">
                        {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-600 pl-1.5 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                    placeholder="e.g., Vaccination Drive, Health Screening"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                    rows="3"
                    placeholder="Event details and additional information..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Center Type *</label>
                    <select
                      value={formData.center_type}
                      onChange={(e) => setFormData({...formData, center_type: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    >
                      <option value="RHU">RHU</option>
                      <option value="BARANGAY">Barangay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Barangay *</label>
                    <select
                      value={formData.barangay}
                      onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    >
                      <option value="" className="text-gray-500">Select barangay...</option>
                      {BARANGAYS.map(b => (
                        <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Specific Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                    placeholder="Building, room number, or address..."
                  />
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  {editingEvent && (
                    <button
                      onClick={() => handleDelete(editingEvent.event_id)}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Event
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="ml-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm"
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}