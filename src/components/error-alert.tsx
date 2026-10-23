import { TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Could not finish</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
