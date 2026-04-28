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
import { format, parse, getDaysInMonth, isWeekend } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useCalendarStore } from '~/stores/calendar';
import type { MonthlyReportRow, SettingsData } from '~/types/report';

export function useDocxExport () {
  const exportingDocx = ref(false);

  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
  };

  const getWorkingDays = (year: number, month: number) => {
    const calendarStore = useCalendarStore();
    const workingDays: Date[] = [];
    const daysCount = getDaysInMonth(new Date(year, month));

    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day);
      const dateStr = format(date, "yyyy-MM-dd");
      const isWeekendDay = isWeekend(date);
      const isHoliday = calendarStore.holidays.some(
        (h: any) => h.date === dateStr,
      );

      if (!isWeekendDay && !isHoliday) {
        workingDays.push(date);
      }
    }
    return workingDays;
  };

  async function exportBAST (
    monthlyRows: MonthlyReportRow[],
    selectedDateStr: string,
    settings: SettingsData
  ) {
    const parsedDate = parse(selectedDateStr, 'yyyy-MM', new Date());
    const dayName = format(new Date(), 'eeee', { locale: idLocale });
    const dayNum = format(new Date(), 'dd');
    const monthName = format(parsedDate, 'MMMM', { locale: idLocale });
    const yearName = format(parsedDate, 'yyyy');

    // Calculate working days for distribution
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth();
    const workingDays = getWorkingDays(year, month);
    const workingDaysCount = workingDays.length;
    const rowCount = monthlyRows.length;

    exportingDocx.value = true;
    try {
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Arial',
                size: 24, // 10pt
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: 12240,
                  height: 15840,
                },
                margin: {
                  top: 720,
                  bottom: 720,
                  left: 1440,
                  right: 1440,
                },
              },
            },
            children: [
              // --- TITLE ---
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'BERITA ACARA SERAH TERIMA',
                    bold: true,
                    size: 36,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'HASIL PEKERJAAN PEKERJA PROJECT',
                    size: 24,
                  }),
                ],
                spacing: { after: 400 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: 'Nomor : ........', size: 24 }),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: `Pada hari ini, ${dayName} tanggal ${dayNum} bulan ${monthName} tahun ${yearName}, telah dilakukan serah terima hasil pekerjaan project untuk periode:`,
                    size: 24
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({ text: `Bulan: ${monthName}    Tahun: ${yearName}`, size: 24 }),
                ],
                spacing: { after: 400 },
              }),

              // --- 1. PIHAK YANG MENYERAHKAN ---
              new Paragraph({
                indent: { left: 280, hanging: 280 },
                children: [
                  new TextRun({ text: '1. PIHAK YANG MENYERAHKAN', bold: true, size: 24 }),
                ],
              }),
              new Paragraph({
                indent: { left: 280 },
                children: [
                  new TextRun({ text: '(Pekerja Project)', italics: true, size: 18, color: '888888' }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                indent: { left: 280 },
                tabStops: [{ type: 'left', position: 1700 }, { type: 'left', position: 1700 }],
                children: [
                  new TextRun({ text: 'Nama', size: 24 }),
                  new TextRun({ text: '\t : \t', size: 24 }),
                  new TextRun({ text: settings.user_name || '-', size: 24 }),
                ],
              }),
              new Paragraph({
                indent: { left: 280 },
                tabStops: [{ type: 'left', position: 1700 }, { type: 'left', position: 1700 }],
                children: [
                  new TextRun({ text: 'No Pekerja', size: 24 }),
                  new TextRun({ text: '\t : \t', size: 24 }),
                  new TextRun({ text: settings.user_nopeg || '-', size: 24 }),
                ],
              }),
              new Paragraph({
                indent: { left: 280 },
                tabStops: [{ type: 'left', position: 1700 }, { type: 'left', position: 1700 }],
                children: [
                  new TextRun({ text: 'Posisi', size: 24 }),
                  new TextRun({ text: '\t : \t', size: 24 }),
                  new TextRun({ text: settings.user_position || '-', size: 24 }),
                ],
              }),
              new Paragraph({
                indent: { left: 280 },
                tabStops: [{ type: 'left', position: 1700 }, { type: 'left', position: 1700 }],
                children: [
                  new TextRun({ text: 'Team/Fungsi', size: 24 }),
                  new TextRun({ text: '\t : \t', size: 24 }),
                  new TextRun({ text: settings.user_function || settings.user_unit || '-', size: 24 }),
                ],
              }),

              new Paragraph({
                indent: { left: 280 },
                children: [
                  new TextRun({ text: 'Selanjutnya disebut ', size: 24 }),
                  new TextRun({ text: 'PIHAK PERTAMA', bold: true, size: 24 }),
                ],
                spacing: { before: 200, after: 300 },
              }),

              // --- 2. PIHAK YANG MENERIMA ---
              new Paragraph({
                indent: { left: 280, hanging: 280 },
                children: [
                  new TextRun({ text: '2. PIHAK YANG MENERIMA', bold: true, size: 24 }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                indent: { left: 280 },
                tabStops: [{ type: 'left', position: 1700 }, { type: 'left', position: 1700 }],
                children: [
                  new TextRun({ text: 'Nama', size: 24 }),
                  new TextRun({ text: '\t : \t', size: 24 }),
                  new TextRun({ text: settings.div_head_name || 'Ida Wahyuni Yanuarti', size: 24 }),
                ],
              }),
              new Paragraph({
                indent: { left: 280 },
                tabStops: [{ type: 'left', position: 1700 }, { type: 'left', position: 1700 }],
                children: [
                  new TextRun({ text: 'Jabatan', size: 24 }),
                  new TextRun({ text: '\t : \t', size: 24 }),
                  new TextRun({ text: settings.div_head_position?.split(' ')[0] || 'Kepala Divisi', size: 24 }),
                ],
              }),
              new Paragraph({
                indent: { left: 280 },
                tabStops: [{ type: 'left', position: 1700 }, { type: 'left', position: 1700 }],
                children: [
                  new TextRun({ text: 'Unit Kerja', size: 24 }),
                  new TextRun({ text: '\t : \t', size: 24 }),
                  new TextRun({ text: settings.div_head_position?.split(' ').slice(1).join(' ') || 'Divisi Teknologi Informasi', size: 24 }),
                ],
              }),

              new Paragraph({
                indent: { left: 280 },
                children: [
                  new TextRun({ text: 'Selanjutnya disebut ', size: 24 }),
                  new TextRun({ text: 'PIHAK KEDUA', bold: true, size: 24 }),
                ],
                spacing: { before: 200, after: 400 },
              }),

              // --- 3. DASAR PENUGASAN ---
              new Paragraph({
                indent: { left: 280, hanging: 280 },
                children: [
                  new TextRun({ text: '3. DASAR PENUGASAN', bold: true, size: 24 }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                indent: { left: 280 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'Pekerja project melaksanakan pekerjaan berdasarkan kontrak kerja yang dikelola oleh Divisi HC and ditugaskan pada Divisi Teknologi Informasi.',
                    size: 24
                  }),
                ],
                spacing: { after: 400 },
              }),

              // --- 4. RINCIAN HASIL PEKERJAAN ---
              new Paragraph({
                indent: { left: 280, hanging: 280 },
                children: [
                  new TextRun({ text: '4. RINCIAN HASIL PEKERJAAN', bold: true, size: 24 }),
                ],
                spacing: { after: 100 },
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createBASTHeaderCell('No', 5),
                      createBASTHeaderCell('Tanggal', 15),
                      createBASTHeaderCell('Bulan', 10),
                      createBASTHeaderCell('Task/Aktivitas', 30),
                      createBASTHeaderCell('Deliverable', 12),
                      createBASTHeaderCell('Status', 10),
                      createBASTHeaderCell('Keterangan', 13),
                    ],
                  }),
                  ...monthlyRows.map((row, idx) => {
                    const workingDayIndex =
                      rowCount > 1
                        ? Math.min(
                          workingDaysCount - 1,
                          Math.max(
                            0,
                            Math.floor(
                              (idx / (rowCount - 1)) * (workingDaysCount - 1),
                            ),
                          ),
                        )
                        : 0;
                    const rowDate =
                      workingDays[workingDayIndex] || new Date(year, month, 1);

                    return new TableRow({
                      children: [
                        createBASTDataCell((idx + 1).toString(), AlignmentType.CENTER),
                        createBASTDataCell(format(rowDate, 'dd/MM/yyyy'), AlignmentType.CENTER),
                        createBASTDataCell(row.month || format(rowDate, 'MMMM', { locale: idLocale }), AlignmentType.CENTER),
                        createBASTDataCell(row.project || '-', AlignmentType.LEFT),
                        createBASTDataCell('Deliver', AlignmentType.CENTER),
                        createBASTDataCell('Done', AlignmentType.CENTER),
                        createBASTDataCell(row.status || '-', AlignmentType.LEFT),
                      ],
                    });
                  }),
                ],
              }),

              new Paragraph({ text: '', spacing: { after: 400 } }),

              // --- 5. PERNYATAAN ---
              new Paragraph({
                indent: { left: 280, hanging: 280 },
                children: [
                  new TextRun({ text: '5. PERNYATAAN', bold: true, size: 24 }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                indent: { left: 280 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'PIHAK PERTAMA menyatakan bahwa seluruh pekerjaan di atas telah dilaksanakan sesuai dengan tugas dan tanggung jawab yang diberikan.',
                    size: 24
                  }),
                ],
              }),
              new Paragraph({
                indent: { left: 280 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'PIHAK KEDUA menyatakan bahwa hasil pekerjaan telah diterima dan diverifikasi sesuai kebutuhan project.',
                    size: 24
                  }),
                ],
                spacing: { before: 200, after: 400 },
              }),

              // --- 6. PENUTUP ---
              new Paragraph({
                indent: { left: 280, hanging: 280 },
                children: [
                  new TextRun({ text: '6. PENUTUP', bold: true, size: 24 }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                indent: { left: 280 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'Demikian Berita Acara Serah Terima ini dibuat sebagai bukti pelaksanaan dan penyelesaian pekerjaan project pada periode tersebut.',
                    size: 24
                  }),
                ],
                spacing: { after: 600 },
              }),

              // --- 7. TANDA TANGAN ---
              new Paragraph({
                indent: { left: 280, hanging: 280 },
                children: [
                  new TextRun({ text: '7. TANDA TANGAN', bold: true, size: 24 }),
                ],
                spacing: { after: 400 },
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PIHAK PERTAMA', bold: true, size: 24 })] })] }),
                      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PIHAK KEDUA', bold: true, size: 24 })] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '\n\n\n\n', size: 24 })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '\n\n\n\n', size: 24 })] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: `(${settings.user_name || 'Nama'})`, bold: true, size: 24 }),
                            ]
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: `(${settings.user_position || 'Jabatan'})`, size: 20 }),
                            ]
                          }),
                        ]
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: settings.div_head_name || 'Ida Wahyuni Yanuarti', bold: true, size: 24 }),
                            ]
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: settings.div_head_position || 'Kepala Divisi Teknologi Informasi', size: 20 }),
                            ]
                          }),
                        ]
                      }),
                    ],
                  }),
                ],
              }),

            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `BAST PEKERJA IT PROJECT - ${settings.user_name}.docx`);

      return true;
    } catch (error) {
      console.error('BAST export failed:', error);
      throw error;
    } finally {
      exportingDocx.value = false;
    }
  }

  // --- HELPERS ---

  function createBASTProfileRow (label: string, value: string) {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: label, size: 24 })] })],
        }),
        new TableCell({
          width: { size: 3, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: ':', size: 24 })] })],
        }),
        new TableCell({
          width: { size: 77, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 24 })] })],
        }),
      ],
    });
  }

  function createBASTHeaderCell (text: string, width: number) {
    return new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, size: 20 })],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      borders: tableBorders,
      shading: { fill: 'F2F2F2' },
    });
  }

  function createBASTDataCell (text: string, alignment: any) {
    return new TableCell({
      children: [
        new Paragraph({
          alignment: alignment,
          children: [new TextRun({ text: text || '-', size: 18 })],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      borders: tableBorders,
      margins: { left: 50, right: 50, top: 50, bottom: 50 },
    });
  }

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
                      createDataCell(row.month || monthName, AlignmentType.LEFT),
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
                      createSignatureHeaderCell(settings.team_leader_position || 'Team Leader'),
                      createSignatureHeaderCell(settings.dept_head_position || 'Departement Head'),
                      createSignatureHeaderCell(settings.div_head_position || 'Division Head'),
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
                      createSignatureNameCell(settings.team_leader_name || 'Adhel Ekonofian'),
                      createSignatureNameCell(settings.dept_head_name || 'Septri Nur Ithmam'),
                      createSignatureNameCell(settings.div_head_name || 'Ida Wahyuni Yanuarti'),
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
          children: [new Paragraph({ children: [new TextRun({ text: label, size: 24 })] })],
          verticalAlign: VerticalAlign.CENTER,
          borders: tableBorders,
          margins: { left: 100, right: 100 },
        }),
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ':', size: 24 })] })],
          verticalAlign: VerticalAlign.CENTER,
          borders: tableBorders,
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 24 })] })],
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
        children: [new TextRun({ text, bold: true, size: 24 })],
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
          children: [new TextRun({ text, size: 24 })],
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
          children: [new TextRun({ text, bold: true, size: 24 })],
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
          children: [new TextRun({ text: '\n\n\n\n', size: 24 })],
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
              size: 24,
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
    exportBAST,
    exportingDocx,
  };
}
