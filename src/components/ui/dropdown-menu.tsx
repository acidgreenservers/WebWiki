import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'left',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className={cn(
          "absolute z-50 mt-1 min-w-[160px] bg-surface border border-border rounded-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-2 duration-200",
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ onClick, children, className }) => (
  <button
    className={cn(
      "w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-border-subtle flex items-center transition-colors",
      className
    )}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    {children}
  </button>
);
