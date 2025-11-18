'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { kbApi, tenantApi } from '@/lib/api';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  tenant: {
    id: string;
    name: string;
  };
  _count: {
    documents: number;
    chunks: number;
  };
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
}

export default function KnowledgeBasesPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: tenantId || '',
    name: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [kbData, tenantData] = await Promise.all([
        kbApi.list(tenantId || undefined),
        tenantApi.list(),
      ]);
      setKbs(kbData.knowledgeBases);
      setTenants(tenantData.tenants);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantId || !formData.name) return;

    try {
      await kbApi.create(formData);
      setFormData({ tenantId: tenantId || '', name: '', description: '' });
      setShowCreateForm(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteKB = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) return;

    try {
      await kbApi.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Knowledge Bases
          {tenantId && kbs.length > 0 && (
            <span className="text-xl text-gray-600 ml-2">
              for {kbs[0]?.tenant.name}
            </span>
          )}
        </h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create Knowledge Base'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={createKB}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant
              </label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter knowledge base name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : kbs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            No knowledge bases yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kbs.map((kb) => (
            <div key={kb.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{kb.name}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {kb.description || 'No description'}
              </p>
              <div className="text-sm text-gray-500 mb-4 space-y-1">
                <div>Tenant: {kb.tenant.name}</div>
                <div>Documents: {kb._count.documents}</div>
                <div>Chunks: {kb._count.chunks}</div>
              </div>
              <div className="flex space-x-2">
                <a
                  href={`/kb/${kb.id}`}
                  className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  Open
                </a>
                <button
                  onClick={() => deleteKB(kb.id)}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-md text-sm hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
