import { CheckCircle, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from './ui/alert-dialog';

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  onConfirm?: () => void;
}

export function NotificationDialog({
  open,
  onOpenChange,
  type,
  title,
  message,
  onConfirm,
}: NotificationDialogProps) {
  const isSuccess = type === 'success';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';
  const titleColor = isSuccess ? 'text-green-900' : 'text-red-900';
  const messageColor = isSuccess ? 'text-green-700' : 'text-red-700';
  const buttonColor = isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  const Icon = isSuccess ? CheckCircle : AlertCircle;

  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={`border-2 ${borderColor} ${bgColor}`}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${iconColor} shrink-0`} />
            <AlertDialogTitle className={titleColor}>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className={messageColor}>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogAction
          onClick={handleConfirm}
          className={`${buttonColor} text-white`}
        >
          OK
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
