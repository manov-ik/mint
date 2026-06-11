"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";

export interface SelectOption {
  label: string;
  value: string | number;
  color?: string;
}

interface CustomSelectProps {
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  className?: string;
}

export function CustomSelect({ value, options, onChange, className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-surface-container-highest border border-outline-variant/30 rounded-lg px-2 py-1 md:px-3 md:py-1.5 text-xs text-primary focus:outline-none focus:border-secondary/50 transition-colors group h-[28px] md:h-[34px] min-w-[80px] md:min-w-[120px] justify-between"
      >
        <div className="flex items-center gap-1.5">
          {selectedOption?.color && (
            <div
              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-outline-variant/30 shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className="font-medium truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown
          size={12}
          className={clsx(
            "text-outline-variant transition-transform duration-300 shrink-0",
            isOpen ? "rotate-180 text-primary" : "group-hover:text-primary"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] z-[100] w-48 max-h-64 overflow-y-auto bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-2xl scrollbar-none origin-top-right"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors",
                    i === 0 && "rounded-t-xl",
                    i === options.length - 1 && "rounded-b-xl",
                    isSelected
                      ? "bg-secondary/10 text-secondary font-medium"
                      : "text-on-surface-variant hover:bg-surface-container-highest hover:text-primary"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div
                        className="w-3 h-3 rounded-full border border-outline-variant/30"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label}
                  </div>
                  {isSelected && <Check size={14} className="text-secondary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
