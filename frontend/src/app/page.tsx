export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to RAG Knowledge Hub
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Multi-tenant knowledge base management with vector search
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Multi-Tenant</h3>
            <p className="text-gray-600">
              Isolate knowledge bases by tenant for secure, scalable access
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Document Ingestion</h3>
            <p className="text-gray-600">
              Ingest text, URLs, and files with automatic chunking and embedding
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Vector Search</h3>
            <p className="text-gray-600">
              Query with semantic search powered by pgvector and OpenAI embeddings
            </p>
          </div>
        </div>
        <div className="mt-12 space-x-4">
          <a
            href="/tenants"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Manage Tenants
          </a>
          <a
            href="/kb"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
          >
            View Knowledge Bases
          </a>
        </div>
      </div>
    </div>
  );
}
