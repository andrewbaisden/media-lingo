import { TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert
      variant="destructive"
      className="rounded-[1.25rem] bg-white/70 px-4 py-3"
    >
      <TriangleAlertIcon />
      <AlertTitle>Could not finish</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
