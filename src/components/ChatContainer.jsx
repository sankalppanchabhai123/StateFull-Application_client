import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useCallback, useState } from "react";
import { ArrowUpRight, Trash } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore.js";
import { formatMessageTime } from "../lib/util";
import toast from "react-hot-toast";
import EmptyChat from "./skeletons/EmptyChat.jsx";


const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const messagedelref = useRef(null);
  const { socket } = useAuthStore();
  const [msg, setmsg] = useState(false);

  useEffect(() => {
    getMessages(selectedUser._id);


    socket.on("deleteMessage", async ({ messageId }) => {
      setmsg(!msg);
    })

    subscribeToMessages();
    return () => {
      unsubscribeFromMessages()
      socket.off("deleteMessage")
    };
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, deleteMessage, messagedelref, socket, msg]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);



  const handleDeleteMessage = async (messageId) => {
    toast((t) => (
      <div className="flex flex-col gap-2 w-80 justify-center align-middle">
        <span>Delete this message?</span>
        <div className="flex gap-2 justify-center align-middle">
          <button
            className="bg-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-300 text-center"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="bg-red-500 px-3 py-1 rounded-md text-sm text-white hover:bg-red-600 text-center"
            ref={messagedelref}
            onClick={async () => {
              toast(
                await deleteMessage(messageId),
                {
                  success: 'Message deleted!',
                  duration: 5,
                  loading: 'Deleting...',
                  error: 'Failed to delete message',
                }
              );
              toast.dismiss(t.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
    });
  };

  // console.log(messages.length)
  if (!messages.length) {
    return (<div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <EmptyChat />
      <MessageInput />
    </div>)
  }



  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4" >
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profile_pic || "/image.png"
                      : selectedUser.profile_pic || "/image.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="flex flex-wrap chat-header mb-1 gap-2 items-center">
              <time className="text-xs opacity-50 ml-1" title={message.createdAt}>
                {formatMessageTime(message.createdAt)}
              </time>

              {message.senderId === authUser._id && (
                <button
                  className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                  title="Delete message"
                  ref={messagedelref}
                  onClick={async () => handleDeleteMessage(message._id)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;