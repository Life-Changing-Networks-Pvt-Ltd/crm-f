import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/services/api";
import type { Socket } from "socket.io-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
// removed ScrollArea import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { acquireRealtimeSocket, releaseRealtimeSocket } from "@/services/realtimeSocket";

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt: string;
}

export default function Messages() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const usersQuery = useQuery({
    queryKey: ["messages", "users"],
    queryFn: async () => (await api.get('/messages/users')).data as User[],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
  const messagesQuery = useQuery({
    queryKey: ["messages", selectedUser?._id],
    enabled: Boolean(selectedUser?._id),
    queryFn: async () => (await api.get(`/messages/${selectedUser!._id}`)).data as Message[],
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
  });

  useEffect(() => {
    // Initialize Socket.io
    const newSocket = acquireRealtimeSocket(currentUser?._id);
    setSocket(newSocket);

    const receiveMessage = (message: Message) => {
      setMessages((prev) => {
        // Only append if it's from the currently selected user (or if we want to show a badge, we'd handle it differently)
        return [...prev, message];
      });
    };
    newSocket.on("receive_message", receiveMessage);

    return () => {
      newSocket.off("receive_message", receiveMessage);
      releaseRealtimeSocket(newSocket);
      setSocket(null);
    };
  }, [currentUser?._id]);

  useEffect(() => {
    setUsers(usersQuery.data || []);
  }, [usersQuery.data]);

  useEffect(() => {
    if (messagesQuery.data) setMessages(messagesQuery.data);
  }, [messagesQuery.data]);

  useEffect(() => {
    if (usersQuery.error) toast.error("Failed to load users");
  }, [usersQuery.error]);

  useEffect(() => {
    if (messagesQuery.error) toast.error("Failed to load messages");
  }, [messagesQuery.error]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const res = await api.post('/messages', {
        recipientId: selectedUser._id,
        content: newMessage,
      });
      
      const sentMessage = res.data;
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");

      if (socket) {
        socket.emit("send_message", {
          recipientId: selectedUser._id,
          message: sentMessage,
        });
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
      <PageHeader title="Messages" description="Manage internal and external messages." />
      
      <div className="flex flex-1 overflow-hidden border rounded-lg bg-background shadow-sm">
        {/* Users Sidebar */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b bg-muted/20 font-medium">Contacts</div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-md transition-colors ${
                    selectedUser?._id === user._id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-10 w-10 border bg-background text-foreground">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="text-left overflow-hidden">
                    <div className="font-medium truncate">{user.name}</div>
                    <div className={`text-xs truncate ${selectedUser?._id === user._id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
              {users.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No contacts found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-background flex items-center gap-3 shadow-sm z-10">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={selectedUser.profilePicture} />
                  <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 bg-muted/10 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    // Check if it's from the selected user or the current user to display it correctly
                    if (msg.sender !== currentUser?._id && msg.sender !== selectedUser._id) {
                        return null; // Ignore messages from other chats for now
                    }

                    const isMine = msg.sender === currentUser?._id;
                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-background border rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 rounded-full shadow-sm"
                  />
                  <Button type="submit" size="icon" className="rounded-full shrink-0 shadow-sm" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/10">
              <div className="text-center">
                <UserIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select a contact to start messaging</p>
                <p className="text-sm opacity-60">Choose someone from the left sidebar to open their chat.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
