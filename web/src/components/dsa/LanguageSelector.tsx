import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Code } from 'lucide-react';
import type { SupportedLanguage } from '@debugLabs/shared';
import { LANGUAGE_OPTIONS } from '../../data/dsaScenarios';
import type { LanguageOption } from '../../types/dsa';

interface Props {
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    LANGUAGE_OPTIONS.find((l) => l.id === selectedLanguage) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: LanguageOption) => {
    onSelectLanguage(option.id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-[#1a1a1d] hover:bg-[#222226] border border-white/[0.08] hover:border-white/[0.14] text-[#ededed] text-xs font-medium px-2.5 py-1.5 rounded-[6px] transition-colors duration-150 disabled:opacity-50 cursor-pointer select-none"
        title="Select Programming Language"
      >
        <Code className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
        <span className="font-mono text-[12px]">{currentOption.name}</span>
        <span className="text-[10px] text-[#85858b] hidden sm:inline">
          ({currentOption.version})
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#85858b] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-[#18181b] border border-white/[0.1] rounded-[8px] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[11px] font-mono text-[#85858b] border-b border-white/[0.06] mb-1">
            Supported Languages
          </div>
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.id === selectedLanguage;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors duration-100 ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                    : 'text-[#ededed] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-mono text-[12px]">{option.name}</span>
                  <span className="text-[10px] text-[#85858b]">{option.version}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
