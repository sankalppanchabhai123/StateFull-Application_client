import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  remoteUser: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    set({remoteUser:userId});
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    // console.log(messageData)         //i am getting this
    try {
      const res = await axiosInstance.post(`/message/send/${selectedUser._id}`, messageData);
      // console.log("inside try block of sendMessage")
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.log(error)
      toast.error(error);
    }
  },

  deleteMessage: async (id) => {
    try {
      const { remoteUser:userId } = get();
      const res = await axiosInstance.delete(`/message/${id}`);
      console.log("message deleted : ",res);
      await get().getMessages(userId);

    } catch (error) {
      console.log(error)
    }
  },

  subscribeToMessages: () => {                                    //   listen to new messages
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {

      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));