import React, { useState } from 'react';

interface AstroCardProps {
  result: {
    content: string;
    title: string;
    last_modified: string;
    astro_category: string;
    astro_name: string;
    astro_type: string;
    snippet: string;
    distance: number;
  };
  index: number;
}

const AstroCard: React.FC<AstroCardProps> = ({ result, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSimilarityPercentage = (distance: number) => {
    return Math.round((1 - distance) * 100);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-TW');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
            {result.title || result.astro_name}
          </h3>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="bg-primary/10 text-primary px-2 py-1 rounded">
              {result.astro_category}
            </span>
            <span className="bg-secondary/10 text-secondary-foreground px-2 py-1 rounded">
              {result.astro_type}
            </span>
            <span className="bg-accent/10 text-accent-foreground px-2 py-1 rounded">
              相似度: {getSimilarityPercentage(result.distance)}%
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground ml-4">
          #{index + 1}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {result.snippet || result.content?.substring(0, 200) + '...'}
        </p>
      </div>

      {result.content && (
        <div className="mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            {isExpanded ? '收起內容' : '查看完整內容'}
          </button>
          
          {isExpanded && (
            <div className="mt-2 p-3 bg-muted/30 rounded border border-border">
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {result.content}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
        <span>占星類別: {result.astro_name}</span>
        {result.last_modified && (
          <span>更新時間: {formatDate(result.last_modified)}</span>
        )}
      </div>
    </div>
  );
};

export default AstroCard;