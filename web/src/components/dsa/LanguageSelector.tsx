import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Code2 } from 'lucide-react';
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
        className="glass-inset flex h-8 cursor-pointer select-none items-center gap-2 rounded-full px-3 text-xs font-normal text-[#ededed] transition-colors hover:bg-white/[0.08] disabled:opacity-40"
        title="Select programming language"
      >
        <Code2 className="w-3.5 h-3.5 text-[#85858b] stroke-[1.5]" />
        <span className="font-mono text-[12px]">{currentOption.name}</span>
        <span className="text-[11px] text-[#85858b] hidden sm:inline tabular-nums">
          {currentOption.version}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#85858b] stroke-[1.5] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="glass absolute right-0 z-50 mt-2 w-48 rounded-2xl py-1.5">
          <div className="mb-1 border-b border-white/[0.06] px-3 py-1 text-[11px] font-medium tracking-wide text-[#85858b]">
            Language
          </div>
          <div className="space-y-0.5 p-1">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.id === selectedLanguage;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-white/[0.1] font-medium text-[#ededed]'
                      : 'text-[#a1a1a6] hover:bg-white/[0.06] hover:text-[#ededed]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px]">{option.name}</span>
                    <span className="text-[10px] text-[#85858b] tabular-nums">
                      {option.version}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[1.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
