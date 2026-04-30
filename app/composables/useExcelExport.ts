import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import type { ReportRow, SettingsData } from '~/types/report'

export function useExcelExport() {
  const exporting = ref(false)

  async function exportToExcel(dailyRows: ReportRow[], monthName: string, settings: SettingsData) {
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
        labelCell.font = { name: 'Calibri', size: 11, bold: true }

        const valueCell = dailySheet.getCell(`C${row}`)
        valueCell.value = `: ${value}`
        valueCell.font = { name: 'Calibri', size: 11, bold: true }
      }

      addMeta(4, 'NAMA', settings.user_name || 'Devi Adi Nufriana')
      addMeta(5, 'BULAN', monthName.split(' ')[0] || 'April')
      addMeta(6, 'JABATAN', settings.user_position || 'Staff IT Governance')

      // Placeholder Logo (H1:H6)
      // For now, we just leave it or add a text placeholder
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
        defaultPath: `Data_Kehadiran_${monthName.replace(' ', '_')}.xlsx`,
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

  return {
    exportToExcel,
    exporting,
  }
}
