import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, get, push, set, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  MessageSquare,
  Users,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  read: boolean;
}

interface Conversation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
}

const Messages = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;

    const fetchConversations = async () => {
      try {
        // Get all campaigns where user is creator or has submitted work
        const campaignsSnap = await get(ref(database, 'campaigns'));
        const worksSnap = await get(ref(database, `works/${profile.uid}`));

        const userConversations: Conversation[] = [];

        if (campaignsSnap.exists()) {
          const campaigns = campaignsSnap.val();
          Object.entries(campaigns).forEach(([campaignId, campaign]: [string, any]) => {
            if (campaign.creatorId === profile.uid) {
              // User is campaign creator
              userConversations.push({
                id: campaignId,
                campaignId,
                campaignTitle: campaign.title,
                participants: [profile.uid], // Will be updated when messages are fetched
                unreadCount: 0,
                updatedAt: campaign.createdAt,
              });
            }
          });
        }

        if (worksSnap.exists()) {
          const works = worksSnap.val();
          Object.values(works).forEach((work: any) => {
            // Check if conversation already exists
            const existingConv = userConversations.find(c => c.campaignId === work.campaignId);
            if (!existingConv) {
              userConversations.push({
                id: work.campaignId,
                campaignId: work.campaignId,
                campaignTitle: work.campaignTitle,
                participants: [profile.uid],
                unreadCount: 0,
                updatedAt: work.submittedAt,
              });
            }
          });
        }

        // Fetch last messages and unread counts for each conversation
        for (const conv of userConversations) {
          const messagesRef = ref(database, `messages/${conv.campaignId}`);
          const messagesSnap = await get(messagesRef);

          if (messagesSnap.exists()) {
            const messagesData = messagesSnap.val();
            const messagesArray: Message[] = Object.values(messagesData)
              .sort((a: any, b: any) => a.timestamp - b.timestamp);

            if (messagesArray.length > 0) {
              conv.lastMessage = messagesArray[messagesArray.length - 1];
              conv.updatedAt = conv.lastMessage.timestamp;

              // Count unread messages
              conv.unreadCount = messagesArray.filter(
                (msg: Message) => msg.senderId !== profile.uid && !msg.read
              ).length;

              // Update participants
              const participants = new Set(conv.participants);
              messagesArray.forEach((msg: Message) => participants.add(msg.senderId));
              conv.participants = Array.from(participants);
            }
          }
        }

        // Sort conversations by last message timestamp
        userConversations.sort((a, b) => b.updatedAt - a.updatedAt);
        setConversations(userConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [profile?.uid]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(database, `messages/${selectedConversation.campaignId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesArray: Message[] = Object.values(messagesData)
          .sort((a: any, b: any) => a.timestamp - b.timestamp);

        setMessages(messagesArray);

        // Mark messages as read
        const updates: { [key: string]: any } = {};
        messagesArray.forEach((msg: Message) => {
          if (msg.senderId !== profile?.uid && !msg.read) {
            updates[`messages/${selectedConversation.campaignId}/${msg.id}/read`] = true;
          }
        });

        if (Object.keys(updates).length > 0) {
          set(ref(database), updates);
        }
      } else {
        setMessages([]);
      }
    });

    return () => off(messagesRef);
  }, [selectedConversation, profile?.uid]);

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !profile) return;

    setSending(true);
    try {
      const messageRef = push(ref(database, `messages/${selectedConversation.campaignId}`));
      const messageData = {
        id: messageRef.key,
        senderId: profile.uid,
        senderName: profile.fullName,
        senderAvatar: profile.profileImage,
        content: newMessage.trim(),
        timestamp: Date.now(),
        read: false,
      };

      await set(messageRef, messageData);
      setNewMessage('');

      // Update conversation timestamp
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, updatedAt: Date.now(), lastMessage: messageData }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-foreground mb-8">
            Messages
          </h1>

          <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-muted rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No conversations yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start a conversation by working on campaigns
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="" />
                              <AvatarFallback>
                                <Users className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm truncate">
                                  {conversation.campaignTitle}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              {conversation.lastMessage && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(conversation.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedConversation ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {selectedConversation.campaignTitle}
                    </div>
                  ) : (
                    'Select a conversation'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[500px]">
                {selectedConversation ? (
                  <>
                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.senderId === profile?.uid ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.senderId !== profile?.uid && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.senderAvatar} />
                                <AvatarFallback>
                                  {message.senderName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                message.senderId === profile?.uid
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.senderId !== profile?.uid && (
                                <p className="text-xs font-medium mb-1">
                                  {message.senderName}
                                </p>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {formatTime(message.timestamp)}
                                {message.senderId === profile?.uid && message.read && (
                                  <CheckCircle2 className="h-3 w-3 inline ml-1" />
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          size="icon"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-semibold text-muted-foreground mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a campaign conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;
