"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LanguageOption } from "@/lib/languages";

type LanguageSelectorProps = {
  id: string;
  label: string;
  value: string;
  options: readonly LanguageOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function LanguageSelector({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
