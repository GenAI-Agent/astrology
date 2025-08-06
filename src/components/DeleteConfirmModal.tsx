"use client";

import { X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "確認刪除",
  message = "確定要刪除這個對話嗎？此操作無法復原。"
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-secondary/50 transition-colors"
        >
          <X className="w-5 h-5 text-secondary-foreground/60" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-secondary-foreground">{message}</p>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}