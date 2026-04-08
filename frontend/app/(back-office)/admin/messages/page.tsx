'use client';

import { Header } from '@/components/Header';
import { usePermission } from '@/hooks/usePermission';
import { useEffect, useState } from 'react';
import { Trash2, Eye, EyeOff } from 'lucide-react';

interface Message {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const { hasPermission } = usePermission();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (message: Message) => {
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !message.read }),
      });

      if (response.ok) {
        setMessages(
          messages.map((msg) =>
            msg.id === message.id ? { ...msg, read: !msg.read } : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages(messages.filter((msg) => msg.id !== messageId));
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  if (!hasPermission('manage_messages')) {
    return (
      <div className="flex flex-col">
        <Header title="Messages" />
        <div className="p-8">
          <p className="text-red-600">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Messages" />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-[#E5E7EB]">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-[#6B7280]">
                  Aucun message
                </div>
              ) : (
                messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`w-full p-4 text-left hover:bg-[#F9FAFB] transition-colors border-l-4 ${
                      message.read
                        ? 'border-l-gray-300'
                        : 'border-l-[#E8690A]'
                    } ${
                      selectedMessage?.id === message.id
                        ? 'bg-[#FEF3EA]'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-medium text-sm ${
                          message.read
                            ? 'text-[#6B7280]'
                            : 'text-[#1A1A2E] font-semibold'
                        }`}>
                          {message.subject}
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {message.senderName} ({message.senderEmail})
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          {new Date(message.createdAt).toLocaleDateString(
                            'fr-FR'
                          )}
                        </p>
                      </div>
                      {!message.read && (
                        <div className="w-2 h-2 bg-[#E8690A] rounded-full mt-1"></div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="bg-white rounded-lg shadow p-6 h-fit">
            {selectedMessage ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">DE</p>
                  <p className="font-semibold text-[#1A1A2E]">
                    {selectedMessage.senderName}
                  </p>
                  <p className="text-sm text-[#6B7280]">
                    {selectedMessage.senderEmail}
                  </p>
                  {selectedMessage.senderPhone && (
                    <p className="text-sm text-[#6B7280]">
                      {selectedMessage.senderPhone}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-[#6B7280] mb-1">SUJET</p>
                  <p className="font-semibold text-[#1A1A2E]">
                    {selectedMessage.subject}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#6B7280] mb-1">DATE</p>
                  <p className="text-sm text-[#374151]">
                    {new Date(selectedMessage.createdAt).toLocaleDateString(
                      'fr-FR'
                    )}{' '}
                    à{' '}
                    {new Date(selectedMessage.createdAt).toLocaleTimeString(
                      'fr-FR'
                    )}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB]">
                  <p className="text-sm whitespace-pre-wrap text-[#374151]">
                    {selectedMessage.content}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleMarkAsRead(selectedMessage)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors text-sm font-medium"
                  >
                    {selectedMessage.read ? (
                      <>
                        <EyeOff size={16} />
                        Non lu
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Lu
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[#6B7280] text-center">
                Sélectionnez un message pour voir les détails
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
