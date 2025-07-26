'use client';

import React, { useState, useRef } from 'react';
import { AgentProgress } from '../types/agents';

export default function ResearchApp() {
  const [domainFocus, setDomainFocus] = useState('');
  const [contextDetails, setContextDetails] = useState('');
  const [startupFirmsFile, setStartupFirmsFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [finalHTML, setFinalHTML] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domainFocus.trim()) {
      setError('Domain focus is required');
      return;
    }

    setIsRunning(true);
    setError(null);
    setProgress([]);
    setOverallProgress(0);
    setFinalHTML(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('domainFocus', domainFocus);
      if (contextDetails) {
        formData.append('contextDetails', contextDetails);
      }
      if (startupFirmsFile) {
        formData.append('startupFirmsFile', startupFirmsFile);
      }

      // Start the research workflow
      const response = await fetch('/api/research', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start research workflow');
      }

      const result = await response.json();
      setWorkflowId(result.workflowId);

      // Start polling for progress
      pollProgress(result.workflowId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRunning(false);
    }
  };

  const pollProgress = async (id: string) => {
    try {
      const response = await fetch(`/api/research?workflowId=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get workflow status');
      }

      const data = await response.json();
      setProgress(data.progress || []);
      setOverallProgress(data.overallProgress || 0);

      if (data.completed && data.finalHTML) {
        setFinalHTML(data.finalHTML);
        setIsRunning(false);
      } else if (!data.completed) {
        // Continue polling
        setTimeout(() => pollProgress(id), 3000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get progress');
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!finalHTML) return;
    
    const blob = new Blob([finalHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defense-ai-research-report-${domainFocus.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Defense AI Research Platform
            </h1>
            <p className="text-lg text-gray-600">
              Multi-Agent AI Research for Defense/National Security Domains
            </p>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Domain Focus */}
              <div>
                <label htmlFor="domainFocus" className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Focus *
                </label>
                <input
                  type="text"
                  id="domainFocus"
                  value={domainFocus}
                  onChange={(e) => setDomainFocus(e.target.value)}
                  placeholder="e.g., cyber, maritime, space, electronic warfare"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isRunning}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the defense/national security domain area to focus your research on
                </p>
              </div>

              {/* Context Details */}
              <div>
                <label htmlFor="contextDetails" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  id="contextDetails"
                  value={contextDetails}
                  onChange={(e) => setContextDetails(e.target.value)}
                  placeholder="Provide additional context and details on how AI agents should tailor their research..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isRunning}
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="startupFirmsFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Startup Firms Data (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    id="startupFirmsFile"
                    ref={fileInputRef}
                    onChange={(e) => setStartupFirmsFile(e.target.files?.[0] || null)}
                    accept=".csv,.json,.txt"
                    className="hidden"
                    disabled={isRunning}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isRunning}
                  >
                    Choose File
                  </button>
                  {startupFirmsFile && (
                    <span className="text-sm text-gray-600">
                      {startupFirmsFile.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a CSV or JSON file containing startup/firm data for detailed analysis
                </p>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isRunning || !domainFocus.trim()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Research in Progress...' : 'Start AI Research'}
                </button>
              </div>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">❌</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {isRunning && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Research Progress</h3>
                  <span className="text-sm font-medium text-gray-600">{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                {progress.map((agent) => (
                  <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(agent.status)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{agent.agentId}</div>
                        <div className="text-sm text-gray-600">{agent.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                      <span className="text-sm text-gray-500">{agent.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Display */}
          {finalHTML && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Research Complete</h3>
                <button
                  onClick={downloadReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Download Report
                </button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={finalHTML}
                  className="w-full h-96 border-0"
                  title="Research Report"
                />
              </div>
              
              <p className="mt-4 text-sm text-gray-600">
                Your comprehensive AI autonomy research report is ready. You can view it above or download it as an HTML file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 