"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Check } from "lucide-react";
import { useApi } from "@/lib/api-client";
import clsx from "clsx";

interface EditTaskModalProps {
  task: { id: string; title: string; date: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function EditTaskModal({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
}: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const { fetchApi } = useApi();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form state when a task is passed in
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDate(task.date?.split("T")[0] || "");
    }
  }, [task]);

  // Handle the Escape key to close the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function handleSave() {
    if (!task || !title.trim() || !date) return;
    setIsSaving(true);
    try {
      const res = await fetchApi(`/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), date }),
      });
      if (res.ok) {
        onTaskUpdated();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            className="relative w-full max-w-[320px] bg-surface-container-high border border-outline-variant/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold  tracking-widest text-primary uppercase ">
                Edit Task
              </h2>
              <button
                onClick={onClose}
                className="text-outline hover:text-primary transition-colors p-1"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest text-outline uppercase ml-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-3.5 py-2.5 text-sm text-primary placeholder:text-outline focus:outline-none focus:border-secondary/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-widest text-outline uppercase ml-1">
                  Date
                </label>
                <div className="relative flex items-center group">
                  <div className="absolute left-3.5 text-outline pointer-events-none group-hover:text-primary transition-colors z-10">
                    <Calendar size={14} />
                  </div>
                  <div className="relative w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl overflow-hidden focus-within:border-secondary/50 transition-colors">
                    {/* Styled display layer */}
                    <div className="pl-10 pr-3.5 py-2.5 text-sm text-primary pointer-events-none select-none">
                      {date
                        ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : <span className="text-outline">Pick a date</span>
                      }
                    </div>
                    {/* Native input overlaid invisibly — triggers picker on tap */}
                    <input
                      type="date"
                      value={date}
                      onClick={(e) => {
                        if ("showPicker" in HTMLInputElement.prototype) {
                          try { (e.target as HTMLInputElement).showPicker(); } catch {}
                        }
                      }}
                      onChange={(e) => setDate(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !date}
              className="mt-2 w-full py-3 bg-secondary text-on-secondary rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <Check size={14} strokeWidth={3} />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
