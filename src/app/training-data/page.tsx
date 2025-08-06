'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface AstroDataset {
  id: string;
  userId: string;
  promptTemplate: string;
  history: string;
  toolResult: string;
  userInput: string;
  modelAnswer: string;
  tristanAnswer: string;
  modelScore: number | null;
  tristanScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TrainingDataPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [datasets, setDatasets] = useState<AstroDataset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchDatasets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/astro-dataset?page=${pagination.page}&limit=${pagination.limit}`);
      const data = await response.json();

      if (data.success) {
        setDatasets(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch datasets');
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDatasets();
    }
  }, [status, pagination.page, fetchDatasets]);

  const handleSelectAll = () => {
    if (selectedIds.length === datasets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(datasets.map(d => d.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleExport = async (format: 'json' | 'csv' | 'jsonl') => {
    try {
      const response = await fetch('/api/astro-dataset/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds.length > 0 ? selectedIds : undefined,
          format
        })
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `astro_dataset_export_${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      } else if (format === 'jsonl') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `astro_dataset_export_${new Date().toISOString()}.jsonl`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      } else {
        const data = await response.json();
        if (data.success) {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `astro_dataset_export_${new Date().toISOString()}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('Data exported successfully');
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Export failed');
    }
  };

  const handleViewDetail = (id: string) => {
    router.push(`/training-data/${id}`);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 min-h-screen bg-background text-foreground">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Training Data Management</h1>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={datasets.length === 0}
          >
            Export as JSON {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
          </button>
          <button
            onClick={() => handleExport('jsonl')}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={datasets.length === 0}
          >
            Export as JSONL {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={datasets.length === 0}
          >
            Export as CSV {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="min-w-full bg-card border border-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === datasets.length && datasets.length > 0}
                  onChange={handleSelectAll}
                  className="rounded accent-primary"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-card-foreground w-1/5">User Input</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-card-foreground w-1/4">Model Answer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-card-foreground w-1/4">Tristan Answer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-card-foreground w-20">Model Score</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-card-foreground w-20">Tristan Score</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-card-foreground w-24">Created At</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-card-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {datasets.map((dataset) => (
              <tr key={dataset.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(dataset.id)}
                    onChange={() => handleSelect(dataset.id)}
                    className="rounded accent-primary"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-card-foreground">{truncateText(dataset.userInput)}</td>
                <td className="px-4 py-3 text-sm text-card-foreground">{truncateText(dataset.modelAnswer)}</td>
                <td className="px-4 py-3 text-sm text-card-foreground">{truncateText(dataset.tristanAnswer)}</td>
                <td className="px-4 py-3 text-sm">
                  {dataset.modelScore !== null ? (
                    <span className={`font-semibold ${dataset.modelScore >= 70 ? 'text-green-600' : dataset.modelScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {dataset.modelScore}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {dataset.tristanScore !== null ? (
                    <span className={`font-semibold ${dataset.tristanScore >= 70 ? 'text-green-600' : dataset.tristanScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {dataset.tristanScore}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-card-foreground">
                  {new Date(dataset.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleViewDetail(dataset.id)}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {datasets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-card">
            No training data available
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-border rounded-lg bg-card text-card-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-card-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-border rounded-lg bg-card text-card-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}