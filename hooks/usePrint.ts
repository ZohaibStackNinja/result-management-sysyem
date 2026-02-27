import { useCallback } from "react";

export const usePrint = () => {
  return useCallback((elementId: string) => {
    const content = document.getElementById(elementId);
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: system-ui, sans-serif; }
            .page-break { page-break-after: always; }
            .no-print { display: none !important; }
            table { border-collapse: collapse; width: 100%; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }, []);
};
