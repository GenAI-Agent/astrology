'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

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

export default function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { status } = useSession();
  const [dataset, setDataset] = useState<AstroDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    tristanAnswer: '',
    tristanScore: '',
    modelScore: ''
  });

  const { id } = use(params);

  const fetchDataset = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/astro-dataset/${id}`);
      const data = await response.json();

      if (data.success) {
        setDataset(data.data);
        setEditForm({
          tristanAnswer: data.data.tristanAnswer,
          tristanScore: data.data.tristanScore?.toString() || '',
          modelScore: data.data.modelScore?.toString() || ''
        });
      } else {
        toast.error('Dataset not found');
        router.push('/training-data');
      }
    } catch (error) {
      console.error('Error fetching dataset:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDataset();
    }
  }, [status, fetchDataset]);

  const handleSave = async () => {
    try {
      const updateData: any = {
        tristanAnswer: editForm.tristanAnswer
      };

      if (editForm.tristanScore !== '') {
        updateData.tristanScore = parseInt(editForm.tristanScore);
      }

      if (editForm.modelScore !== '') {
        updateData.modelScore = parseInt(editForm.modelScore);
      }

      const response = await fetch(`/api/astro-dataset/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        setDataset(data.data);
        setIsEditing(false);
        toast.success('Dataset updated successfully');
      } else {
        toast.error('Failed to update dataset');
      }
    } catch (error) {
      console.error('Error updating dataset:', error);
      toast.error('Error updating data');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dataset?')) {
      return;
    }

    try {
      const response = await fetch(`/api/astro-dataset/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dataset deleted successfully');
        router.push('/training-data');
      } else {
        toast.error('Failed to delete dataset');
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Error deleting data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  if (!dataset) {
    return null;
  }

  return (
    <div className="w-full px-6 py-8 min-h-screen bg-background text-foreground">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Dataset Details</h1>
        <div className="flex gap-4">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    tristanAnswer: dataset.tristanAnswer,
                    tristanScore: dataset.tristanScore?.toString() || '',
                    modelScore: dataset.modelScore?.toString() || ''
                  });
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => router.push('/training-data')}
            className="px-4 py-2 border border-border rounded-lg bg-card text-card-foreground hover:bg-muted/50 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Metadata, Scores & Tristan Answer */}
        <div className="lg:col-span-1 space-y-6">
          {/* Dataset Info */}
          <div className="bg-card border border-border shadow-sm rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Dataset Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ID</p>
                <p className="text-sm font-mono text-card-foreground bg-muted/30 px-2 py-1 rounded text-ellipsis overflow-hidden">{dataset.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">User ID</p>
                <p className="text-sm font-mono text-card-foreground bg-muted/30 px-2 py-1 rounded text-ellipsis overflow-hidden">{dataset.userId}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm text-card-foreground">{new Date(dataset.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Updated</p>
                  <p className="text-sm text-card-foreground">{new Date(dataset.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="bg-card border border-border shadow-sm rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Evaluation Scores</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Model Score</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={editForm.modelScore || '0'}
                      onChange={(e) => setEditForm({ ...editForm, modelScore: e.target.value })}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-card-foreground">{editForm.modelScore || '0'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-semibold text-card-foreground">
                    {dataset.modelScore !== null ? (
                      <span className={`${dataset.modelScore >= 70 ? 'text-green-600' : dataset.modelScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {dataset.modelScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not scored</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Tristan Score</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={editForm.tristanScore || '0'}
                      onChange={(e) => setEditForm({ ...editForm, tristanScore: e.target.value })}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-card-foreground">{editForm.tristanScore || '0'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-semibold text-card-foreground">
                    {dataset.tristanScore !== null ? (
                      <span className={`${dataset.tristanScore >= 70 ? 'text-green-600' : dataset.tristanScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {dataset.tristanScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not scored</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tristan Answer */}
          <div className="bg-card border border-border shadow-sm rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Tristan Answer
            </h3>
            {isEditing ? (
              <textarea
                value={editForm.tristanAnswer}
                onChange={(e) => setEditForm({ ...editForm, tristanAnswer: e.target.value })}
                className="w-full p-3 border border-input rounded-lg min-h-[200px] bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent resize-vertical text-sm"
                placeholder="Enter Tristan's answer..."
              />
            ) : (
              <div className="bg-muted/30 border border-border/50 rounded-lg p-3 max-h-96 overflow-y-auto">
                {dataset.tristanAnswer ? (
                  <p className="text-card-foreground whitespace-pre-wrap leading-relaxed text-sm">{dataset.tristanAnswer}</p>
                ) : (
                  <p className="text-muted-foreground italic text-sm">No answer provided yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Input */}
          <div className="bg-card border border-border shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              User Input
            </h3>
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
              <p className="text-card-foreground whitespace-pre-wrap leading-relaxed">{dataset.userInput}</p>
            </div>
          </div>

          {/* Model Answer */}
          <div className="bg-card border border-border shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Model Answer
            </h3>
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4 prose prose-sm max-w-none prose-headings:text-card-foreground prose-p:text-card-foreground prose-strong:text-card-foreground prose-code:text-card-foreground prose-pre:bg-muted/50">
              <ReactMarkdown>{dataset.modelAnswer}</ReactMarkdown>
            </div>
          </div>


          {/* Technical Details - Collapsible */}
          <details className="bg-card border border-border shadow-sm rounded-lg">
            <summary className="p-6 cursor-pointer hover:bg-muted/20 transition-colors">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                Technical Details
              </h3>
            </summary>
            <div className="px-6 pb-6 space-y-6 border-t border-border/50">
              {/* Prompt Template */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Prompt Template</h4>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-4 font-mono text-sm">
                  <p className="text-card-foreground whitespace-pre-wrap">{dataset.promptTemplate}</p>
                </div>
              </div>

              {/* History */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Conversation History</h4>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
                  <p className="text-card-foreground whitespace-pre-wrap text-sm leading-relaxed">{dataset.history}</p>
                </div>
              </div>

              {/* Tool Result */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Tool Result</h4>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-4 font-mono text-sm">
                  <p className="text-card-foreground whitespace-pre-wrap">{dataset.toolResult}</p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}