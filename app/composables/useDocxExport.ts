import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  UnderlineType,
  VerticalAlign,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import { format, parse } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { MonthlyReportRow, SettingsData } from '~/types/report';

export function useDocxExport () {
  const exportingDocx = ref(false);

  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
  };

  async function exportToDocx (
    monthlyRows: MonthlyReportRow[],
    selectedDateStr: string,
    settings: SettingsData
  ) {
    const parsedDate = parse(selectedDateStr, 'yyyy-MM', new Date());
    const monthName = format(parsedDate, 'MMMM', { locale: idLocale });
    const yearName = format(parsedDate, 'yyyy');
    exportingDocx.value = true;
    try {
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Calibri',
              },
            },
          },
        },
        sections: [
          {
            properties: {},
            children: [
              // --- INTERNAL TAG ---
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Internal',
                    color: 'C00000',
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),

              // --- TITLE ---
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'DATA PEKERJA',
                    bold: true,
                    size: 40,
                    underline: {
                      type: UnderlineType.SINGLE,
                    },
                  }),
                ],
                spacing: { after: 400 },
              }),

              // --- A. IDENTITAS JABATAN ---
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'A. IDENTITAS JABATAN',
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),

              // --- PROFILE TABLE ---
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  createProfileRow('Nama', settings.user_name || '-'),
                  createProfileRow('Nopeg', settings.user_nopeg || '-'),
                  createProfileRow('Jabatan', settings.user_position || '-'),
                  createProfileRow('Unit Kerja', settings.user_unit || '-'),
                  createProfileRow('Bagian / Fungsi Kerja', settings.user_function || '-'),
                ],
              }),

              new Paragraph({ text: '', spacing: { after: 400 } }),

              // --- B. PROJECT YANG DIKERJAKAN ---
              new Paragraph({
                children: [
                  new TextRun({
                    text: `B. PROJECT YANG DIKERJAKAN TAHUN ${yearName}`,
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),

              // --- PROJECT TABLE ---
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  new TableRow({
                    children: [
                      createHeaderCell('Bulan', 15),
                      createHeaderCell('Project Yang Dikerjakan', 50),
                      createHeaderCell('Progres', 10),
                      createHeaderCell('Done', 10),
                      createHeaderCell('Status Pekerjaan', 15, 'Continuing (Daily) / Project Enhance'),
                    ],
                  }),
                  ...monthlyRows.map(row => new TableRow({
                    children: [
                      createDataCell(monthName, AlignmentType.LEFT),
                      createDataCell(row.project, AlignmentType.LEFT),
                      createDataCell(row.progres, AlignmentType.LEFT),
                      createDataCell(row.done, AlignmentType.LEFT),
                      createDataCell(row.status, AlignmentType.LEFT),
                    ],
                  })),
                ],
              }),

              new Paragraph({ text: '', spacing: { after: 600 } }),

              // --- SIGNATURE TABLE ---
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  new TableRow({
                    children: [
                      createSignatureHeaderCell('Team Leader'),
                      createSignatureHeaderCell('Departement Head'),
                      createSignatureHeaderCell('Division Head'),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createSignaturePlaceholderCell(),
                      createSignaturePlaceholderCell(),
                      createSignaturePlaceholderCell(),
                    ],
                  }),
                  new TableRow({
                    children: [
                      createSignatureNameCell('Adhel Ekonofian'),
                      createSignatureNameCell('Septri Nur Ithmam'),
                      createSignatureNameCell('Mohammad Azis Efendi'),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Form Task Job - ${settings.user_name}.docx`);

      return true;
    } catch (error) {
      console.error('Docx export failed:', error);
      throw error;
    } finally {
      exportingDocx.value = false;
    }
  }

  // --- HELPERS ---

  function createProfileRow (label: string, value: string) {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: label, size: 22 })] })],
          verticalAlign: VerticalAlign.CENTER,
          borders: tableBorders,
          margins: { left: 100, right: 100 },
        }),
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ':', size: 22 })] })],
          verticalAlign: VerticalAlign.CENTER,
          borders: tableBorders,
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 22 })] })],
          verticalAlign: VerticalAlign.CENTER,
          borders: tableBorders,
          margins: { left: 100, right: 100 },
        }),
      ],
    });
  }

  function createHeaderCell (text: string, width: number, subtext?: string) {
    const children = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 22 })],
      })
    ];

    if (subtext) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: subtext, size: 18, bold: true })],
        })
      );
    }

    return new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      children,
      verticalAlign: VerticalAlign.CENTER,
      borders: tableBorders,
    });
  }

  function createDataCell (text: string, alignment: AlignSetting) {
    return new TableCell({
      children: [
        new Paragraph({
          alignment,
          children: [new TextRun({ text, size: 22 })],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      borders: tableBorders,
      margins: { left: 100, right: 100, top: 100, bottom: 100 },
    });
  }

  function createSignatureHeaderCell (text: string) {
    return new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 22 })],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      borders: tableBorders,
    });
  }

  function createSignaturePlaceholderCell () {
    return new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '\n\n\n\n', size: 22 })],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      borders: tableBorders,
    });
  }

  function createSignatureNameCell (text: string) {
    return new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text,
              bold: true,
              size: 22,
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      borders: tableBorders,
    });
  }

  return {
    exportToDocx,
    exportingDocx,
  };
}
