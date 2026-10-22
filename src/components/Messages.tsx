import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { schoolService } from '../services/schoolService';
import {
  Message,
  MessagePriority,
  MessageCategory,
  MessageAcknowledgement,
} from '../types';
import {
  Mail,
  Send,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CheckCheck,
  Eye,
  Plus,
  X,
  FileText,
  Users,
  ShieldAlert,
} from 'lucide-react';

export const Messages: React.FC = () => {
  const { currentUser, currentTeacher } = useAuth();
  const isHM = currentUser.role === 'HM';
  const isAHM = currentUser.role === 'AHM';
  const canSend = isHM || isAHM;

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [ackNote, setAckNote] = useState('');
  const [feedback, setFeedback] = useState('');

  // Compose state
  const [composeData, setComposeData] = useState<{
    recipientType: 'All Teachers' | 'Individual' | 'Subject Group' | 'Class Teachers';
    recipientTeacherId: string;
    subject: string;
    body: string;
    priority: MessagePriority;
    category: MessageCategory;
    requiresAck: boolean;
  }>({
    recipientType: 'All Teachers',
    recipientTeacherId: '',
    subject: '',
    body: '',
    priority: 'Normal',
    category: 'General notice',
    requiresAck: true,
  });

  const allTeachers = schoolService.getTeachers().filter((t) => t.active);
  const allMessages = schoolService.getMessages();
  const allAcks = schoolService.getAcknowledgements();

  // Filter messages for inbox
  const inboxMessages = allMessages.filter((m) => {
    if (m.recipientType === 'All Teachers') return true;
    if (m.recipientType === 'Individual' && m.recipientIds?.includes(currentUser.teacherId)) return true;
    if (m.senderId === currentUser.teacherId) return false;
    return true;
  });

  // Sent messages by this user
  const sentMessages = allMessages.filter((m) => m.senderId === currentUser.teacherId || (canSend && m.senderRole === 'HM'));

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.subject.trim() || !composeData.body.trim()) {
      alert('Please fill in both subject and message body.');
      return;
    }

    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.teacherId,
      senderName: `${currentTeacher?.name || currentUser.displayName} (${currentUser.role})`,
      senderRole: currentUser.role,
      recipientType: composeData.recipientType,
      recipientIds: composeData.recipientTeacherId ? [composeData.recipientTeacherId] : undefined,
      subject: composeData.subject.trim(),
      body: composeData.body.trim(),
      priority: composeData.priority,
      category: composeData.category,
      requiresAck: composeData.requiresAck,
      createdAt: new Date().toISOString(),
    };

    await schoolService.sendMessage(newMsg);
    setFeedback('Message successfully dispatched to teachers!');
    setTimeout(() => setFeedback(''), 4000);
    setComposeData({
      recipientType: 'All Teachers',
      recipientTeacherId: '',
      subject: '',
      body: '',
      priority: 'Normal',
      category: 'General notice',
      requiresAck: true,
    });
    setActiveTab('sent');
  };

  const handleAcknowledge = async (msgId: string) => {
    await schoolService.acknowledgeMessage(
      msgId,
      currentUser.teacherId,
      currentTeacher?.name || currentUser.displayName,
      ackNote.trim() || undefined
    );
    setFeedback('Official instruction acknowledged. Record logged in Headmaster Audit Register.');
    setTimeout(() => setFeedback(''), 4000);
    setIsAckModalOpen(false);
    setAckNote('');
  };

  const getPriorityBadge = (p: MessagePriority) => {
    switch (p) {
      case 'Emergency':
        return 'bg-red-600 text-white animate-pulse';
      case 'Urgent':
        return 'bg-amber-500 text-slate-950';
      case 'Normal':
      default:
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
            <Mail className="w-4 h-4" />
            <span>Official Administrative Channel</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1 text-white">
            HM-to-AT Messaging & Directives
          </h1>
          <p className="text-blue-100 text-xs mt-1 max-w-2xl">
            Official instructions, emergency notices, provisional routines, and meeting circulars. Requires mandatory acknowledgment from Assistant Teachers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canSend && (
            <button
              onClick={() => setActiveTab('compose')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              + Compose Directive
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'inbox'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox ({inboxMessages.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'sent'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          Sent Directives ({sentMessages.length})
        </button>
        {canSend && (
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'compose'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            Compose Message
          </button>
        )}
      </div>

      {/* Inbox View */}
      {activeTab === 'inbox' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700">
          {inboxMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">Your inbox is clear.</p>
              <p className="mt-0.5">No unread official instructions at this moment.</p>
            </div>
          ) : (
            inboxMessages.map((msg) => {
              const myAck = allAcks.find(
                (a) => a.messageId === msg.id && a.teacherId === currentUser.teacherId
              );

              return (
                <div
                  key={msg.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    msg.priority === 'Emergency'
                      ? 'bg-red-50/50 dark:bg-red-950/20'
                      : !myAck && msg.requiresAck
                      ? 'bg-amber-50/40 dark:bg-amber-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityBadge(
                          msg.priority
                        )}`}
                      >
                        {msg.priority}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {msg.category}
                      </span>
                      <span className="text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(msg.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div>
                      {msg.requiresAck ? (
                        myAck ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Acknowledged on {new Date(myAck.acknowledgedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedMessage(msg);
                              setIsAckModalOpen(true);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer animate-pulse"
                          >
                            ✓ Acknowledge Instruction
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">Notice only</span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mt-2">
                    {msg.subject}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 whitespace-pre-line leading-relaxed">
                    {msg.body}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Sender: <strong className="text-slate-700 dark:text-slate-300">{msg.senderName}</strong>
                    </span>
                    <span>Recipient: {msg.recipientType}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sent Directives View (with HM Acknowledgement Audit tracker!) */}
      {activeTab === 'sent' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700">
          {sentMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No sent directives yet.</p>
            </div>
          ) : (
            sentMessages.map((msg) => {
              const acks = allAcks.filter((a) => a.messageId === msg.id);

              return (
                <div key={msg.id} className="p-4 sm:p-5 text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] uppercase">
                        {msg.category}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {msg.subject}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Dispatched: {new Date(msg.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300">{msg.body}</p>

                  {/* HM Acknowledgement Tracker Audit List */}
                  {msg.requiresAck && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                          Teacher Acknowledgement Status ({acks.length} / {allTeachers.length} Confirmed)
                        </span>
                        <span className="text-[10px] text-slate-400">Official Compliance Tracker</span>
                      </div>

                      {acks.length === 0 ? (
                        <p className="text-[11px] text-amber-600 italic">
                          Awaiting teacher acknowledgements...
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {acks.map((ack) => (
                            <span
                              key={ack.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {ack.teacherName} (
                              {new Date(ack.acknowledgedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Compose Form */}
      {activeTab === 'compose' && canSend && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-2xl mx-auto">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-700 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Issue Official Headmaster Notice / Instruction
          </h2>

          <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Recipient Audience *
                </label>
                <select
                  value={composeData.recipientType}
                  onChange={(e) =>
                    setComposeData({
                      ...composeData,
                      recipientType: e.target.value as any,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="All Teachers">All Teachers (School Wide)</option>
                  <option value="Individual">Individual Teacher</option>
                  <option value="Subject Group">Subject Group</option>
                  <option value="Class Teachers">Class Teachers</option>
                </select>
              </div>

              {composeData.recipientType === 'Individual' && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Teacher *
                  </label>
                  <select
                    value={composeData.recipientTeacherId}
                    onChange={(e) =>
                      setComposeData({
                        ...composeData,
                        recipientTeacherId: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Select recipient...</option>
                    {allTeachers.map((t) => (
                      <option key={t.teacherId} value={t.teacherId}>
                        {t.name} ({t.designation})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Message Category *
                </label>
                <select
                  value={composeData.category}
                  onChange={(e) =>
                    setComposeData({
                      ...composeData,
                      category: e.target.value as MessageCategory,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <option value="General notice">General notice</option>
                  <option value="Urgent instruction">Urgent instruction</option>
                  <option value="Provisional routine">Provisional routine</option>
                  <option value="Substitute assignment">Substitute assignment</option>
                  <option value="Meeting notice">Meeting notice</option>
                  <option value="Examination duty">Examination duty</option>
                  <option value="Leave decision">Leave decision</option>
                  <option value="Emergency announcement">Emergency announcement</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Priority Level *
                </label>
                <select
                  value={composeData.priority}
                  onChange={(e) =>
                    setComposeData({
                      ...composeData,
                      priority: e.target.value as MessagePriority,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                required
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder="e.g. Mandatory Staff Meeting today at 04:35 PM"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Directive Body / Instructions *
              </label>
              <textarea
                rows={4}
                required
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                placeholder="Write official directive content here..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reqAck"
                checked={composeData.requiresAck}
                onChange={(e) => setComposeData({ ...composeData, requiresAck: e.target.checked })}
                className="rounded text-blue-600"
              />
              <label htmlFor="reqAck" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Require Mandatory Digital Acknowledgement from recipient teachers
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('inbox')}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Directive
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Acknowledge Modal */}
      {isAckModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Official Instruction Acknowledgement
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              By confirming, you record that you have read and understood this directive from the Headmaster.
            </p>

            <div className="my-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                {selectedMessage.subject}
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">
                {selectedMessage.body}
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                Optional Acknowledgement Note to HM:
              </label>
              <input
                type="text"
                value={ackNote}
                onChange={(e) => setAckNote(e.target.value)}
                placeholder="e.g. Noted with thanks / Will attend on time."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsAckModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAcknowledge(selectedMessage.id)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Confirm Acknowledgement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
