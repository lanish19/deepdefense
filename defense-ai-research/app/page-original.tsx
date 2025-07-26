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
      case 'pending': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Defense AI Research Platform
          </h1>
          <p className="text-lg text-gray-600">
            Multi-Agent AI Research for Defense/National Security Domains
          </p>
        </div>

        {/* Test Links */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Links:</h2>
          <div className="space-x-4">
            <a href="/test" className="text-blue-600 hover:underline">Test Page</a>
            <a href="/api/test" className="text-blue-600 hover:underline">Test API</a>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="domainFocus" className="block text-sm font-medium text-gray-700 mb-2">
                Domain Focus *
              </label>
              <input
                type="text"
                id="domainFocus"
                value={domainFocus}
                onChange={(e) => setDomainFocus(e.target.value)}
                placeholder="e.g., cyber, maritime, space"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="contextDetails" className="block text-sm font-medium text-gray-700 mb-2">
                Context Details (Optional)
              </label>
              <textarea
                id="contextDetails"
                value={contextDetails}
                onChange={(e) => setContextDetails(e.target.value)}
                placeholder="Additional context for research..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="startupFirmsFile" className="block text-sm font-medium text-gray-700 mb-2">
                Startup Firms File (Optional)
              </label>
              <input
                type="file"
                id="startupFirmsFile"
                ref={fileInputRef}
                onChange={(e) => setStartupFirmsFile(e.target.files?.[0] || null)}
                accept=".csv,.json"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload CSV or JSON file with startup firms data
              </p>
            </div>

            <button
              type="submit"
              disabled={isRunning}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Research in Progress...' : 'Start Research'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Progress Display */}
        {isRunning && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Research Progress</h2>
            
            {/* Overall Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Individual Agent Progress */}
            <div className="space-y-3">
              {progress.map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(agent.status)}</span>
                    <span className="font-medium">{agent.agentId}</span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Display */}
        {finalHTML && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Research Complete</h2>
              <button
                onClick={downloadReport}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Download Report
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={finalHTML}
                className="w-full h-96"
                title="Research Report"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 