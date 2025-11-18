'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { kbApi, ingestionApi, queryApi } from '@/lib/api';

interface Document {
  id: string;
  sourceType: string;
  sourceMetaJson: any;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

interface QueryResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: any;
  documentId: string;
}

export default function KnowledgeBasePage() {
  const params = useParams();
  const id = params.id as string;

  const [kb, setKb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ingestion state
  const [activeTab, setActiveTab] = useState<'documents' | 'query' | 'ingest'>('documents');
  const [ingestType, setIngestType] = useState<'text' | 'url'>('text');
  const [ingestText, setIngestText] = useState('');
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingesting, setIngesting] = useState(false);

  // Query state
  const [queryText, setQueryText] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [querying, setQuerying] = useState(false);
  const [topK, setTopK] = useState(5);

  const loadKB = async () => {
    try {
      setLoading(true);
      const data = await kbApi.get(id);
      setKb(data.knowledgeBase);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    setError('');

    try {
      if (ingestType === 'text') {
        await ingestionApi.ingestText(id, { text: ingestText });
        setIngestText('');
      } else {
        await ingestionApi.ingestUrl(id, { url: ingestUrl });
        setIngestUrl('');
      }
      loadKB();
      setActiveTab('documents');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIngesting(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuerying(true);
    setError('');

    try {
      const data = await queryApi.query(id, {
        query: queryText,
        topK,
        includeMetadata: true,
      });
      setQueryResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setQuerying(false);
    }
  };

  useEffect(() => {
    loadKB();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!kb) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Knowledge base not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{kb.name}</h1>
        <p className="text-gray-600 mt-2">{kb.description || 'No description'}</p>
        <div className="mt-4 flex space-x-4 text-sm text-gray-600">
          <span>Tenant: {kb.tenant.name}</span>
          <span>Documents: {kb._count.documents}</span>
          <span>Chunks: {kb._count.chunks}</span>
          <span>Queries: {kb._count.queryLogs}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8">
          {(['documents', 'query', 'ingest'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg shadow">
          {kb.documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No documents yet. Ingest some content to get started!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chunks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kb.documents.map((doc: Document) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.sourceType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.sourceType === 'url'
                        ? doc.sourceMetaJson?.url || 'N/A'
                        : `${doc.sourceType} document`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc._count.chunks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Query Tab */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Query Knowledge Base</h2>
            <form onSubmit={handleQuery}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query
                </label>
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your query..."
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top K Results: {topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                type="submit"
                disabled={querying}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {querying ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {queryResults.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Results ({queryResults.length})
              </h3>
              <div className="space-y-4">
                {queryResults.map((result, idx) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Result {idx + 1}
                      </span>
                      <span className="text-sm text-gray-600">
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-gray-800 mb-2">{result.content}</p>
                    {result.metadata && (
                      <div className="text-xs text-gray-500">
                        <pre className="bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(result.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ingest Tab */}
      {activeTab === 'ingest' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Ingest Content</h2>

          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setIngestType('text')}
                className={`px-4 py-2 rounded-md ${
                  ingestType === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setIngestType('url')}
                className={`px-4 py-2 rounded-md ${
                  ingestType === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                URL
              </button>
            </div>

            <form onSubmit={handleIngest}>
              {ingestType === 'text' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={ingestText}
                    onChange={(e) => setIngestText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste your text content here..."
                    rows={10}
                    required
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={ingestUrl}
                    onChange={(e) => setIngestUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/article"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={ingesting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {ingesting ? 'Ingesting...' : 'Ingest'}
              </button>
            </form>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> File upload is not yet implemented. Use text or URL
              ingestion for now.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
