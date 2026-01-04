import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import Leaderboard from "./pages/Leaderboard";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import MyWork from "./pages/MyWork";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Chatbase script injection
    if (!window.chatbase || window.chatbase("getState") !== "initialized") {
      window.chatbase = (...args: any[]) => {
        if (!window.chatbase.q) window.chatbase.q = [];
        window.chatbase.q.push(args);
      };

      window.chatbase = new Proxy(window.chatbase, {
        get(target, prop) {
          if (prop === "q") return target.q;
          return (...args: any[]) => target(prop, ...args);
        },
      });

      const onLoad = () => {
        const script = document.createElement("script");
        script.src = "https://www.chatbase.co/embed.min.js";
        script.id = "PITsT-xjH85WkL-sowY3G";
        script.domain = "www.chatbase.co";
        document.body.appendChild(script);
      };

      if (document.readyState === "complete") {
        onLoad();
      } else {
        window.addEventListener("load", onLoad);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile/:userId" element={<Profile />} />

              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/create"
                element={
                  <ProtectedRoute>
                    <CreateCampaign />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <ProfileEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-work"
                element={
                  <ProtectedRoute>
                    <MyWork />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
