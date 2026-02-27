/**
 * Print Utilities - Centralized printing logic
 * Handles print mode management, page breaks, and print styling
 */

export type PrintMode = "none" | "single" | "bulk" | "broadsheet";

export interface PrintOptions {
  pageSize?: "a4-portrait" | "a4-landscape";
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colorMode?: "color" | "grayscale";
  pageBreakAfter?: boolean;
}

/**
 * Generates print media style rules
 */
export const getPrintStyles = (options: PrintOptions = {}): string => {
  const {
    pageSize = "a4-portrait",
    margins = { top: 10, right: 10, bottom: 10, left: 10 },
    colorMode = "color",
  } = options;

  const sizeMap = {
    "a4-portrait": "portrait",
    "a4-landscape": "landscape",
  };

  return `
    @media print {
      @page {
        size: ${pageSize === "a4-landscape" ? "A4 landscape" : "A4 portrait"};
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      }
      
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
      
      .no-print {
        display: none !important;
      }
      
      .print-page {
        page-break-after: always;
        page-break-inside: avoid;
      }
      
      .print-container {
        width: 100%;
        display: block;
      }
      
      table {
        border-collapse: collapse;
        page-break-inside: avoid;
      }
      
      tr {
        page-break-inside: avoid;
      }
      
      a {
        text-decoration: underline;
        color: #000;
      }
    }
  `;
};

/**
 * Trigger browser print dialog
 */
export const triggerPrint = (): void => {
  if (typeof window !== "undefined") {
    window.print();
  }
};

/**
 * Generate unique ID for print containers
 */
export const generatePrintContainerId = (): string => {
  return `print-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if user is in print preview mode
 */
export const isPrintPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("print").matches;
};

/**
 * Format data for CSV export (bonus utility)
 */
export const preparePrintData = (
  data: Record<string, any>[],
  fields: string[],
): string => {
  const headers = fields.join(",");
  const rows = data.map((row) =>
    fields
      .map((field) => {
        const value = row[field] ?? "";
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        return stringValue.includes(",")
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      })
      .join(","),
  );
  return [headers, ...rows].join("\n");
};

/**
 * Center print content on screen
 */
export const centerPrintContent = (): string => `
  .print-modal-content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #f5f5f5;
  }
  
  @media print {
    .print-modal-content {
      display: block;
      background: white;
      min-height: 0;
    }
  }
`;
