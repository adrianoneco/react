import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InfoAlertProps {
  title?: string;
  message: string;
}

export function InfoAlert({ title = "Informação", message }: InfoAlertProps) {
  return (
    <Alert className="border-l-4 border-l-primary bg-primary/5" data-testid="alert-info">
      <Info className="h-4 w-4 text-primary" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
