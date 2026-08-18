"use client";

import { useRef, useState } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  uploadChatFile,
  toMessageAttachment,
} from "@/features/chat/api/message";
import type { MessageAttachment } from "@/features/chat/types/message.type";

interface Props {
  onSend: (payload: {
    content?: string;
    attachments?: MessageAttachment[];
  }) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSend, disabled }: Props) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = content.trim().length > 0 || files.length > 0;

  const handleSend = async () => {
    if (disabled || uploading || !canSend) return;
    try {
      await onSend({
        content: content.trim() || undefined,
        attachments: files.length ? files : undefined,
      });
      setContent("");
      setFiles([]);
    } catch {
      // errors are surfaced by the caller via toast
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        const up = await uploadChatFile(file);
        setFiles((prev) => [...prev, toMessageAttachment(up)]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="flex flex-col gap-2 border-t border-border p-2 md:p-3">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[140px] truncate">{f.filename}</span>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="rounded p-0.5 hover:bg-muted"
                aria-label={`Xóa ${f.filename}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <label
          className={cn(
            "cursor-pointer text-muted-foreground hover:text-foreground",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Paperclip className="h-5 w-5" />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFile}
            disabled={disabled || uploading}
          />
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Bạn không thể gửi tin nhắn trong nhóm này."
              : "Nhập tin nhắn (Enter để gửi, Shift+Enter để xuống dòng)..."
          }
          className="min-h-10 flex-1 resize-none"
          rows={1}
          disabled={disabled}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || uploading || !canSend}
          aria-label="Gửi"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
