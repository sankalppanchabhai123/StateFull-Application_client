// App.jsx
import { useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";
import VideoInterface from "./components/VideoInterface";

import { useAuthStore } from "./store/useAuthStore";
import { useTheme } from "./store/useThemeStore";
import { useVideoStore } from "./store/useVideoStore";

function App() {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useTheme();
  const { handleIncomingCall, handleIceCandidate, callStatus, endCall, peer } = useVideoStore();

  const handleIceCandidateEvent = useCallback(
    async ({ candidate }) => {
      if (candidate) {
        await handleIceCandidate({ candidate });
      }
    },
    [handleIceCandidate]
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleIncomingCallEvent = useCallback(
    async ({ from, signal }) => {
      console.log("Incoming call received:", { from, signal });
      if (callStatus) return;
      await handleIncomingCall({ from, signal });
    },
    [callStatus, handleIncomingCall]
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", handleIncomingCallEvent);
    
    socket.on("call-answered", async ({ signal }) => {
      if (peer && peer.signalingState === "have-local-offer") {
        try {
          console.log("Setting remote description for answer:", signal);
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
        } catch (err) {
          console.error("Failed to set remote description:", err);
          endCall();
        }
      } else {
        console.warn("Peer not in correct state for setting remote answer:", peer?.signalingState);
      }
    });

    socket.on("ice-candidate", handleIceCandidateEvent);
    
    socket.on("call-ended", () => {
      console.log("Call ended signal received");
      if (callStatus) endCall();
    });


    return () => {
      socket.off("incoming-call", handleIncomingCallEvent);
      socket.off("call-answered");
      socket.off("ice-candidate", handleIceCandidateEvent);
      socket.off("call-ended");
    };
  }, [socket, handleIncomingCallEvent, handleIceCandidateEvent, callStatus, endCall, peer]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      {callStatus && <VideoInterface callType={callStatus} onClose={endCall} />}
      <Toaster />
    </div>
  );
}

export default App;