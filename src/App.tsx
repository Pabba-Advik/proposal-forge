import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { ProposalWorkspace } from "./components/ProposalWorkspace";
import { KnowledgeBase } from "./components/KnowledgeBase";
import { useState } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "proposals" | "knowledge">("dashboard");
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-semibold text-primary">ProposalForge</h2>
          <Authenticated>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "dashboard"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("proposals")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "proposals"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Proposals
              </button>
              <button
                onClick={() => setCurrentView("knowledge")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "knowledge"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Knowledge Base
              </button>
            </nav>
          </Authenticated>
        </div>
        <SignOutButton />
      </header>
      
      <main className="flex-1">
        <Content 
          currentView={currentView}
          selectedProposalId={selectedProposalId}
          setSelectedProposalId={setSelectedProposalId}
          setCurrentView={setCurrentView}
        />
      </main>
      
      <Toaster />
    </div>
  );
}

function Content({ 
  currentView, 
  selectedProposalId, 
  setSelectedProposalId, 
  setCurrentView 
}: {
  currentView: "dashboard" | "proposals" | "knowledge";
  selectedProposalId: string | null;
  setSelectedProposalId: (id: string | null) => void;
  setCurrentView: (view: "dashboard" | "proposals" | "knowledge") => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Authenticated>
        {currentView === "dashboard" && (
          <Dashboard 
            onViewProposal={(id) => {
              setSelectedProposalId(id);
              setCurrentView("proposals");
            }}
          />
        )}
        {currentView === "proposals" && (
          <ProposalWorkspace 
            selectedProposalId={selectedProposalId}
            onSelectProposal={setSelectedProposalId}
          />
        )}
        {currentView === "knowledge" && <KnowledgeBase />}
      </Authenticated>
      
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[600px] p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">ProposalForge</h1>
              <p className="text-xl text-secondary mb-2">Enterprise Proposal Generation Platform</p>
              <p className="text-gray-600">Streamline your presales process with collaborative proposal creation</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
