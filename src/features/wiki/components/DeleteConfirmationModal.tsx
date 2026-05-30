import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDestructive?: boolean;
  confirmText?: string;
  step?: 1 | 2;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDestructive = true,
  confirmText = "Delete",
  step = 1
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <Card className={`w-full max-w-md bg-surface border-2 ${step === 2 ? 'border-red-danger' : 'border-border shadow-xl'}`}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <CardTitle className={`flex items-center ${step === 2 ? 'text-red-danger' : 'text-text-primary'}`}>
            <AlertTriangle className={`mr-2 h-5 w-5 ${step === 2 ? 'animate-pulse' : 'text-amber-500'}`} />
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-border">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <p className="text-text-primary text-sm leading-relaxed">
            {message}
          </p>

          {step === 2 && (
            <div className="p-3 bg-red-danger/10 border border-red-danger/20 rounded-md">
              <p className="text-xs text-red-danger font-semibold uppercase tracking-wider">
                Warning: This action cannot be undone.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={onClose} className="border-border hover:bg-border">
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onConfirm}
              className={`${step === 2 ? 'bg-red-danger hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'} text-white font-semibold`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
