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
        className="h-8 flex items-center gap-2 bg-[#19191b] hover:bg-[#232325] border border-white/[0.08] hover:border-white/[0.12] text-[#ededed] text-xs font-normal px-2.5 rounded-md transition-colors duration-150 disabled:opacity-50 cursor-pointer select-none"
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
        <div className="absolute right-0 mt-1 w-48 bg-[#19191b] border border-white/[0.08] rounded-lg shadow-xl py-1 z-50">
          <div className="px-3 py-1 text-[11px] font-medium text-[#85858b] border-b border-white/[0.06] mb-1">
            Languages
          </div>
          <div className="p-1 space-y-0.5">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.id === selectedLanguage;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left cursor-pointer transition-colors duration-100 ${
                    isSelected
                      ? 'bg-[#232325] text-[#ededed] font-medium'
                      : 'text-[#a1a1a6] hover:text-[#ededed] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px]">{option.name}</span>
                    <span className="text-[10px] text-[#85858b] tabular-nums">
                      {option.version}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#ededed] stroke-[1.5]" />
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
