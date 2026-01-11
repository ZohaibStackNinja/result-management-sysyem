import React, { useState, useEffect, useRef } from "react";
import { Teacher } from "../../types";
import { User as UserIcon, Search, ChevronDown, Check } from "lucide-react";

interface SearchableTeacherSelectProps {
  teachers: Teacher[];
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  defaultTeacherName?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableTeacherSelect: React.FC<
  SearchableTeacherSelectProps
> = ({
  teachers,
  value,
  onChange,
  placeholder,
  defaultTeacherName,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative w-full ${className || ""}`} ref={wrapperRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-white transition-all cursor-pointer text-sm shadow-xs ${
          disabled
            ? "bg-gray-50 cursor-not-allowed text-gray-400 border-gray-200"
            : "hover:border-primary-400 border-gray-300"
        } ${isOpen ? "ring-2 ring-primary-100 border-primary-500" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <UserIcon
            className={`w-4 h-4 flex-shrink-0 ${
              value ? "text-primary-600" : "text-gray-400"
            }`}
          />
          <span
            className={`truncate ${
              value ? "text-gray-800 font-medium" : "text-gray-500"
            }`}
          >
            {value ||
              (defaultTeacherName
                ? `Default: ${defaultTeacherName}`
                : placeholder || "Select Teacher")}
          </span>
        </div>
        {!disabled && (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="p-1 space-y-0.5">
            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 rounded-md border-b border-dashed border-gray-100 flex items-center justify-between"
              onClick={() => handleSelect("")}
            >
              <span className="italic">
                {defaultTeacherName
                  ? `Use Default (${defaultTeacherName})`
                  : "No specific assignment"}
              </span>
              {!value && <Check className="w-3 h-3 text-secondary-500" />}
            </button>

            {filteredTeachers.map((t) => (
              <button
                key={t.id}
                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between group transition-colors ${
                  value === t.name
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleSelect(t.name)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                </div>
                <span
                  className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${
                    t.campus === "Both"
                      ? "bg-purple-50 text-purple-600 border-purple-100"
                      : t.campus === "Boys"
                      ? "bg-primary-50 text-primary-600 border-primary-100"
                      : "bg-pink-50 text-pink-600 border-pink-100"
                  }`}
                >
                  {t.campus}
                </span>
              </button>
            ))}
            {filteredTeachers.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No teachers found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
