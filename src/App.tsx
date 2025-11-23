
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ConvertAudio from "./pages/ConvertAudio";
import SavedFiles from "./components/SavedFiles";
import DocumentEditor from "./pages/DocumentEditor";
import PresentationEditor from "./pages/PresentationEditor";
import SimpleWordEditor from "./pages/SimpleWordEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/convert-audio" element={<ConvertAudio />} />
            <Route path="/saved-files" element={<SavedFiles />} />
            <Route path="/document-editor/:jobId" element={<DocumentEditor />} />
            <Route path="/presentation-editor/:jobId" element={<PresentationEditor />} />
            <Route path="/simple-word/:jobId" element={<SimpleWordEditor />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
