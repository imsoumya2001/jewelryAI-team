import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Check, X } from "lucide-react";

interface QuickEditFieldProps {
  value: number | string;
  onSave: (value: number) => void;
  type?: "currency" | "number";
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function QuickEditField({ 
  value, 
  onSave, 
  type = "number", 
  prefix = "", 
  suffix = "",
  className = ""
}: QuickEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {prefix && <span className="text-sm text-slate-600">{prefix}</span>}
        <Input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-24 h-8 text-sm"
          step={type === "currency" ? "0.01" : "1"}
          min="0"
        />
        {suffix && <span className="text-sm text-slate-600">{suffix}</span>}
        <Button
          size="sm"
          onClick={handleSave}
          className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600"
        >
          <Check className="w-3 h-3 text-white" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <span className="font-semibold">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit3 className="w-3 h-3 text-blue-600" />
      </Button>
    </div>
  );
}