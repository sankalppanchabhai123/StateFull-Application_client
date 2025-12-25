import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const useAuthStore = create((set, get) => ({
  authUser: null, // Authenticated user data
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true, // Indicates if authentication status is being checked
  socket: null, // Socket connection instance
  BASE_URL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "https://state-full-application-server-yagf.vercel.app/api", // Backend API base URL
  onlineUsers: [], // List of online users

  // Check if the user is authenticated
  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      set({ authUser: response.data });
      get().connectSocket();
    } catch (error) {
      console.error("Error during auth check:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Sign up a new user
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      set({ authUser: response.data });
      toast.success("Account created successfully!");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed.");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // Log in an existing user
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/auth/login", data);
      set({ authUser: response.data });
      toast.success("Logged in successfully!");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Log out the user
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully!");
      get().disconnectSocket();
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(error.response?.data?.message || "Logout failed.");
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      // commenting this line for the connection of the user 

      get().connectSocket();
      const response = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: response.data });
      toast.success("Profile updated successfully!");
      return response;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Profile update failed.");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Connect to the WebSocket server
  connectSocket: () => {
    const { authUser, BASE_URL } = get();                           //BaseUrl=localhost:3000
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL.replace('/api', ''), {
      query: { userId: authUser._id },
    });

    socket.connect();

    socket.on("getOnlineUsers", (userIds) => {
      // console.log("Online users:", userIds);
      set({ onlineUsers: userIds }); // Update the store with the online users
    });

    set({ socket });
  },
  // connectSocket: () => {
  //   const { authUser, BASE_URL, socket } = get(); // Add socket to destructuring

  //   if (!authUser) return;

  //   // Disconnect existing socket before creating new one
  //   if (socket) {
  //     socket.disconnect();
  //   }

  //   // Change BASE_URL - remove /api for socket connection
  //   const socketUrl = BASE_URL.replace('/api', '');

  //   const newSocket = io(socketUrl, {
  //     query: {
  //       userId: String(authUser._id) // Convert to string
  //     },
  //     transports: ["websocket", "polling"] // Add this line
  //   });

  //   newSocket.connect();

  //   newSocket.on("getOnlineUsers", (userIds) => {
  //     // console.log("Online users:", userIds);
  //     set({ onlineUsers: userIds });
  //   });

  //   set({ socket: newSocket });
  // },

  // Disconnect from the WebSocket server
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
