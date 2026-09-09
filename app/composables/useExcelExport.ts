import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { format, parse, getDaysInMonth, isWeekend } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useCalendarStore } from '~/stores/calendar'
import type { MonthlyReportRow, ReportRow } from '~/types/report'
import type { SettingsData } from '~/types/settings'
import { calculateMandaysAllocation } from '~/utils/mandays'

export function useExcelExport() {
  const exporting = ref(false)

  const cleanMarkdown = (text: string): string => {
    if (!text) return '-'
    return text
      .replace(/```[a-zA-Z]*\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .trim()
  }

  const getWorkingDaysCount = (year: number, month: number) => {
    const calendarStore = useCalendarStore()
    const daysCount = getDaysInMonth(new Date(year, month))
    let count = 0
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day)
      const dateStr = format(date, 'yyyy-MM-dd')
      const isWeekendDay = isWeekend(date)
      const isHoliday = calendarStore.holidays.some((h) => h.date === dateStr)

      if (!isWeekendDay && !isHoliday) {
        count++
      }
    }
    return count > 0 ? count : 20
  }

  async function exportToExcel(dailyRows: ReportRow[], monthYear: string, settings: SettingsData) {
    exporting.value = true
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.default.Workbook()

      const thinBorder = {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
      }
      workbook.creator = 'Presence App'

      // --- 1. DAILY REPORT SHEET ---
      const dailySheet = workbook.addWorksheet('Daily Presence')

      // Set column widths
      dailySheet.columns = [
        { width: 4 }, // A (empty)
        { width: 8 }, // B (No)
        { width: 20 }, // C (Tanggal)
        { width: 12 }, // D (Masuk)
        { width: 12 }, // E (Pulang)
        { width: 15 }, // F (Unit Kerja)
        { width: 50 }, // G (Keterangan)
        { width: 25 }, // H (Tanda Tangan)
      ]

      // --- HEADER SECTION ---
      // Title
      dailySheet.mergeCells('B2:G2')
      const titleCell = dailySheet.getCell('B2')
      titleCell.value = 'DATA KEHADIRAN PEKERJA PT.PKSS'
      titleCell.font = { name: 'Calibri', size: 14, bold: true }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

      // Metadata
      const addMeta = (row: number, label: string, value: string) => {
        const labelCell = dailySheet.getCell(`B${row}`)
        labelCell.value = label
        labelCell.font = { name: 'Calibri', size: 12, bold: true }

        const valueCell = dailySheet.getCell(`C${row}`)
        valueCell.value = `: ${value}`
        valueCell.font = { name: 'Calibri', size: 12, bold: true }
      }

      addMeta(4, 'NAMA', settings.user_name)
      addMeta(5, 'BULAN', monthYear.split(' ')[0] || 'April')
      addMeta(6, 'JABATAN', settings.user_position || 'Staff IT Governance')

      // Placeholder Logo (H1:H6)
      dailySheet.getCell('H1').value = '[LOGO]'
      dailySheet.getCell('H1').alignment = { horizontal: 'center', vertical: 'middle' }

      // --- TABLE HEADER (Row 8 & 9) ---
      const headerRows = [8, 9]
      headerRows.forEach((row) => {
        for (let col = 2; col <= 8; col++) {
          const cell = dailySheet.getRow(row).getCell(col)
          cell.border = thinBorder
          cell.font = { bold: true }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
      })

      dailySheet.mergeCells('B8:B9')
      dailySheet.getCell('B8').value = 'No'

      dailySheet.mergeCells('C8:C9')
      dailySheet.getCell('C8').value = 'Tanggal'

      dailySheet.mergeCells('D8:E8')
      dailySheet.getCell('D8').value = 'Jam'
      dailySheet.getCell('D9').value = 'Masuk'
      dailySheet.getCell('E9').value = 'Pulang'

      dailySheet.mergeCells('F8:F9')
      dailySheet.getCell('F8').value = 'Unit Kerja'

      dailySheet.mergeCells('G8:G9')
      dailySheet.getCell('G8').value = 'Keterangan'

      dailySheet.mergeCells('H8:H9')
      dailySheet.getCell('H8').value = 'Tanda Tangan'

      // --- DATA SECTION ---
      dailyRows.forEach((row, index) => {
        const excelRow = dailySheet.getRow(10 + index)

        excelRow.getCell(2).value = index + 1 // No

        // Tanggal (Date Formatting)
        const dateCell = excelRow.getCell(3)
        dateCell.value = new Date(row.date)
        dateCell.numFmt = 'd-mmm-yyyy'

        excelRow.getCell(4).value = row.masuk // Masuk
        excelRow.getCell(5).value = row.pulang // Pulang
        excelRow.getCell(6).value = row.ti || 'TI' // Unit Kerja
        excelRow.getCell(7).value = row.aktivitas // Keterangan
        excelRow.getCell(8).value = '[SIGN]' // Tanda Tangan placeholder

        // Formatting
        for (let col = 2; col <= 8; col++) {
          const cell = excelRow.getCell(col)
          cell.border = thinBorder
          cell.alignment = {
            vertical: 'middle',
            horizontal: col === 7 ? 'left' : 'center',
            wrapText: true,
          }
        }
        excelRow.height = 40 // Fixed height for signature feel
      })

      // --- SIGNATURE SECTION ---
      const signatureStartRow = 10 + dailyRows.length + 2

      // BRI LIFE
      const briLifeCell = dailySheet.getCell(`H${signatureStartRow}`)
      briLifeCell.value = 'BRI LIFE'
      briLifeCell.font = { name: 'Calibri', size: 11, bold: true }
      briLifeCell.alignment = { horizontal: 'center' }

      // Name with dotted line
      const nameCell = dailySheet.getCell(`H${signatureStartRow + 4}`)
      nameCell.value = '...........................Adhel Ekonofian................................'
      nameCell.font = { name: 'Calibri', size: 10, bold: true }
      nameCell.alignment = { horizontal: 'center' }

      // Role
      const roleCell = dailySheet.getCell(`H${signatureStartRow + 5}`)
      roleCell.value = 'TEAM LEADER'
      roleCell.font = { name: 'Calibri', size: 11, bold: true }
      roleCell.alignment = { horizontal: 'center' }

      // --- GENERATE & SAVE ---
      const buffer = await workbook.xlsx.writeBuffer()
      const uint8Array = new Uint8Array(buffer)

      const filePath = await save({
        filters: [
          {
            name: 'Excel',
            extensions: ['xlsx'],
          },
        ],
        defaultPath: `Absensi_${settings.user_name}_${monthYear}.xlsx`,
      })

      if (filePath) {
        await writeFile(filePath, uint8Array)
        return true
      }
      return false
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    } finally {
      exporting.value = false
    }
  }

  async function exportBASTToExcel(
    monthlyRows: MonthlyReportRow[],
    selectedDateStr: string,
    settings: SettingsData,
  ) {
    exporting.value = true
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.default.Workbook()
      workbook.creator = 'Presence App'

      const thinBorder = {
        top: { style: 'thin' as const, color: { argb: 'D9D9D9' } },
        left: { style: 'thin' as const, color: { argb: 'D9D9D9' } },
        bottom: { style: 'thin' as const, color: { argb: 'D9D9D9' } },
        right: { style: 'thin' as const, color: { argb: 'D9D9D9' } },
      }

      const sheet = workbook.addWorksheet('Detail Pekerja')

      // Set column widths matching template
      sheet.columns = [
        { width: 6 }, // A: No
        { width: 20 }, // B: No Pegawai
        { width: 25 }, // C: Nama
        { width: 14 }, // D: Periode
        { width: 45 }, // E: Project/BAU Task
        { width: 22 }, // F: Target Assignment Project (MD)
        { width: 22 }, // G: Total Realisasi Cumulative MD
        { width: 20 }, // H: Total MD This Month
        { width: 22 }, // I: Percentage Realisasi Target
        { width: 45 }, // J: Notes
      ]

      // Parse date & calculate total mandays in selected month
      let parsedDate = parse(selectedDateStr, 'yyyy-MM', new Date())
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date()
      }
      const year = parsedDate.getFullYear()
      const month = parsedDate.getMonth()
      const totalMandaysMonth = getWorkingDaysCount(year, month)
      const periodStr = format(parsedDate, 'MMM-yy')

      // Title section (Rows 1-4)
      const titleCompany = sheet.getCell('A1')
      titleCompany.value = 'PT ASURANSI BRI LIFE'
      titleCompany.font = { name: 'Calibri', size: 14, bold: true }

      const titleDoc = sheet.getCell('A2')
      titleDoc.value = 'Dokumen Serah Terima Pekerjaan (Realisasi Project)'
      titleDoc.font = { name: 'Calibri', size: 12, bold: true }

      const vendorCell = sheet.getCell('A4')
      vendorCell.value = 'Vendor : PKSS'
      vendorCell.font = { name: 'Calibri', size: 11, italic: true }

      // Header labels (Row 6)
      const headers = [
        'No',
        'No Pegawai',
        'Nama',
        'Periode',
        'Project/BAU Task',
        'Target Assignment Project (MD)',
        'Total Realisasi Cumulative MD',
        'Total MD This Month',
        'Percentage Realisasi Target',
        'Notes',
      ]

      const headerRow = sheet.getRow(6)
      headerRow.height = 30
      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1)
        cell.value = h
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1F3864' }, // Dark navy blue matching screenshot
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = thinBorder
      })

      // Subheader descriptions (Row 7)
      const subheaders = [
        '*No',
        '*Diisi no Pegawai',
        '*Diisi nama Pekerja',
        '*merupakan bulan realisasi pekerjaan',
        '*nama project yang ditugaskan',
        '*Total Target MD atas suatu project',
        '*Merupakan total kumulatif MD sampai dengan periode capaian berjalan atas Project yang ditugaskan',
        '*Total realisasi MD atas project per periode',
        '*Persentase realisasi Project',
        '',
      ]

      const subheaderRow = sheet.getRow(7)
      subheaderRow.height = 42
      subheaders.forEach((sub, idx) => {
        const cell = subheaderRow.getCell(idx + 1)
        cell.value = sub
        cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '333333' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FCE4D6' }, // Peach fill matching screenshot
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = thinBorder
      })

      // Calculate Mandays Distribution per Task based on active date sources & total working days in month
      const allocatedMDs = calculateMandaysAllocation(monthlyRows, totalMandaysMonth)

      // Data Rows (Row 8+)
      monthlyRows.forEach((row, idx) => {
        const allocatedMD = allocatedMDs[idx] || 0
        const dataRow = sheet.getRow(8 + idx)
        dataRow.height = 35

        dataRow.getCell(1).value = idx + 1 // No
        dataRow.getCell(2).value = settings.user_nopeg || '700012410952025' // No Pegawai
        dataRow.getCell(3).value = settings.user_name || 'Devi Adi Nufriana' // Nama
        dataRow.getCell(4).value = periodStr // Periode
        dataRow.getCell(5).value = cleanMarkdown(row.project) // Project/BAU Task
        dataRow.getCell(6).value = allocatedMD // Target Assignment Project (MD)
        dataRow.getCell(7).value = allocatedMD // Total Realisasi Cumulative MD
        dataRow.getCell(8).value = allocatedMD // Total MD This Month

        const pctCell = dataRow.getCell(9) // Percentage Realisasi Target
        pctCell.value = 1.0
        pctCell.numFmt = '0.0%'

        dataRow.getCell(10).value = cleanMarkdown(row.status) // Notes

        for (let col = 1; col <= 10; col++) {
          const cell = dataRow.getCell(col)
          cell.border = thinBorder
          cell.font = { name: 'Calibri', size: 10 }
          cell.alignment = {
            vertical: 'middle',
            horizontal: col === 5 || col === 10 ? 'left' : 'center',
            wrapText: true,
          }
        }
      })

      // Signatures section
      const sigStartRow = 8 + monthlyRows.length + 3

      // Make signature physical space row taller (65pt)
      const sigSpaceRow = sheet.getRow(sigStartRow + 1)
      sigSpaceRow.height = 65

      const createSigBlock = (
        startCol: number,
        endCol: number,
        title: string,
        nameVal: string,
        nopegVal: string,
      ) => {
        // Title (Row sigStartRow)
        sheet.mergeCells(sigStartRow, startCol, sigStartRow, endCol)
        const titleCell = sheet.getCell(sigStartRow, startCol)
        titleCell.value = title
        titleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '1F3864' } }
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

        // Signature physical space (Row sigStartRow + 1)
        sheet.mergeCells(sigStartRow + 1, startCol, sigStartRow + 1, endCol)
        for (let col = startCol; col <= endCol; col++) {
          const lineCell = sheet.getCell(sigStartRow + 1, col)
          lineCell.border = {
            bottom: { style: 'thin', color: { argb: 'A6A6A6' } },
          }
        }

        // Nama (Row sigStartRow + 2)
        sheet.mergeCells(sigStartRow + 2, startCol, sigStartRow + 2, endCol)
        const nameCell = sheet.getCell(sigStartRow + 2, startCol)
        nameCell.value = nameVal ? `Nama : ${nameVal}` : 'Nama :'
        nameCell.font = { name: 'Calibri', size: 10 }
        nameCell.alignment = { horizontal: 'left', vertical: 'middle' }

        // No. Pegawai (Row sigStartRow + 3)
        sheet.mergeCells(sigStartRow + 3, startCol, sigStartRow + 3, endCol)
        const nopegCell = sheet.getCell(sigStartRow + 3, startCol)
        nopegCell.value = nopegVal ? `No. Pegawai : ${nopegVal}` : 'No. Pegawai :'
        nopegCell.font = { name: 'Calibri', size: 10 }
        nopegCell.alignment = { horizontal: 'left', vertical: 'middle' }

        // Tanggal (Row sigStartRow + 4)
        sheet.mergeCells(sigStartRow + 4, startCol, sigStartRow + 4, endCol)
        const dateCell = sheet.getCell(sigStartRow + 4, startCol)
        dateCell.value = 'Tanggal :'
        dateCell.font = { name: 'Calibri', size: 10 }
        dateCell.alignment = { horizontal: 'left', vertical: 'middle' }
      }

      createSigBlock(2, 3, 'Dibuat Oleh', settings.user_name || '', settings.user_nopeg || '')
      createSigBlock(5, 6, 'Diperiksa Oleh', '', '')
      createSigBlock(8, 9, 'Disetujui Oleh', settings.div_head_name || '', '')

      // Notes section below signatures
      const notesHeader = sheet.getCell(sigStartRow + 6, 1)
      notesHeader.value = 'Notes :'
      notesHeader.font = { name: 'Calibri', size: 9, italic: true }

      const notesText = sheet.getCell(sigStartRow + 7, 1)
      notesText.value =
        '- Apabila pekerjaan/project merupakan BAU dapat diisikan total MD dalam 1 tahun terhadap bidang pekerjaan tersebut'
      notesText.font = { name: 'Calibri', size: 9, italic: true }

      // Generate & Save File
      const buffer = await workbook.xlsx.writeBuffer()
      const uint8Array = new Uint8Array(buffer)

      const monthNameIndo = format(parsedDate, 'MMMM yyyy', { locale: idLocale })
      const userName = settings.user_name || 'Devi Adi Nufriana'
      const filePath = await save({
        filters: [
          {
            name: 'Excel',
            extensions: ['xlsx'],
          },
        ],
        defaultPath: `BAST - ${userName} - ${monthNameIndo}.xlsx`,
      })

      if (filePath) {
        await writeFile(filePath, uint8Array)
        return true
      }
      return false
    } catch (error) {
      console.error('BAST Excel Export failed:', error)
      throw error
    } finally {
      exporting.value = false
    }
  }

  return {
    exportToExcel,
    exportBASTToExcel,
    getWorkingDaysCount,
    exporting,
  }
}
