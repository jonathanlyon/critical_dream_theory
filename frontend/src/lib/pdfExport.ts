import { jsPDF } from 'jspdf'
import { Dream, formatDate } from './dreamData'

// PDF styling constants
const COLORS = {
  primary: [99, 102, 241] as [number, number, number],     // Indigo
  secondary: [168, 85, 247] as [number, number, number],   // Purple
  accent: [234, 179, 8] as [number, number, number],       // Gold
  text: [31, 41, 55] as [number, number, number],          // Gray-800
  textLight: [107, 114, 128] as [number, number, number],  // Gray-500
  background: [249, 250, 251] as [number, number, number], // Gray-50
}

const FONTS = {
  title: 24,
  heading: 16,
  subheading: 12,
  body: 10,
  small: 8,
}

const MARGINS = {
  left: 20,
  right: 20,
  top: 20,
  bottom: 20,
}

interface ExportOptions {
  userName?: string
  includeAnalysis?: boolean
  includeSummary?: boolean
}

export async function exportDreamsToPDF(
  dreams: Dream[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    userName = 'Dream Journal',
    includeAnalysis = true,
    includeSummary = true,
  } = options

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right

  let yPos = MARGINS.top

  // Helper to check if we need a new page
  const checkNewPage = (neededHeight: number): void => {
    if (yPos + neededHeight > pageHeight - MARGINS.bottom) {
      doc.addPage()
      yPos = MARGINS.top
    }
  }

  // Helper to add text with word wrapping
  const addWrappedText = (
    text: string,
    x: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number] = COLORS.text
  ): number => {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, maxWidth)
    const lineHeight = fontSize * 0.5

    for (const line of lines) {
      checkNewPage(lineHeight)
      doc.text(line, x, yPos)
      yPos += lineHeight
    }

    return lines.length * lineHeight
  }

  // ===== COVER PAGE =====

  // Header gradient simulation (colored rectangle)
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 60, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(FONTS.title)
  doc.setFont('helvetica', 'bold')
  doc.text('Cognitive Dream Theory', pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(FONTS.heading)
  doc.setFont('helvetica', 'normal')
  doc.text('Dream Journal Export', pageWidth / 2, 45, { align: 'center' })

  yPos = 80

  // User info
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(FONTS.subheading)
  doc.text(`Exported for: ${userName}`, MARGINS.left, yPos)
  yPos += 8
  doc.text(`Export Date: ${formatDate(new Date())}`, MARGINS.left, yPos)
  yPos += 8
  doc.text(`Total Dreams: ${dreams.length}`, MARGINS.left, yPos)
  yPos += 20

  // ===== SUMMARY SECTION =====
  if (includeSummary && dreams.length > 0) {
    // Section header
    doc.setFillColor(...COLORS.background)
    doc.rect(MARGINS.left, yPos - 5, contentWidth, 12, 'F')
    doc.setFontSize(FONTS.heading)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text('Dream Summary', MARGINS.left + 5, yPos + 3)
    yPos += 15

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(FONTS.body)
    doc.setTextColor(...COLORS.text)

    // Calculate statistics
    const dreamTypes = dreams.reduce((acc, d) => {
      acc[d.dreamType] = (acc[d.dreamType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const emotionalTones = dreams.reduce((acc, d) => {
      acc[d.emotionalTone] = (acc[d.emotionalTone] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Dream types breakdown
    doc.text('Dream Types:', MARGINS.left, yPos)
    yPos += 6
    for (const [type, count] of Object.entries(dreamTypes)) {
      doc.text(`  - ${type}: ${count} (${Math.round((count / dreams.length) * 100)}%)`, MARGINS.left, yPos)
      yPos += 5
    }
    yPos += 5

    // Emotional tones breakdown
    doc.text('Emotional Tones:', MARGINS.left, yPos)
    yPos += 6
    for (const [tone, count] of Object.entries(emotionalTones)) {
      doc.text(`  - ${tone}: ${count} (${Math.round((count / dreams.length) * 100)}%)`, MARGINS.left, yPos)
      yPos += 5
    }
    yPos += 10

    // Date range
    const sortedDreams = [...dreams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    const oldestDream = sortedDreams[0]
    const newestDream = sortedDreams[sortedDreams.length - 1]

    doc.text(`Date Range: ${formatDate(oldestDream.dateObj)} to ${formatDate(newestDream.dateObj)}`, MARGINS.left, yPos)
    yPos += 15
  }

  // ===== INDIVIDUAL DREAMS =====
  const sortedDreams = [...dreams].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())

  for (let i = 0; i < sortedDreams.length; i++) {
    const dream = sortedDreams[i]

    // Start new page for each dream
    if (i > 0 || yPos > 150) {
      doc.addPage()
      yPos = MARGINS.top
    }

    // Dream header bar
    doc.setFillColor(...COLORS.secondary)
    doc.rect(MARGINS.left, yPos - 5, contentWidth, 15, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(FONTS.subheading)
    doc.setFont('helvetica', 'bold')

    // Truncate title if too long
    let title = dream.title
    if (title.length > 50) {
      title = title.substring(0, 47) + '...'
    }
    doc.text(title, MARGINS.left + 5, yPos + 4)

    // Dream icon (emoji as text)
    doc.text(dream.thumbnailIcon, pageWidth - MARGINS.right - 10, yPos + 4)

    yPos += 18

    // Dream metadata
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(FONTS.body)
    doc.setTextColor(...COLORS.textLight)
    doc.text(`Date: ${formatDate(dream.dateObj)}  |  Type: ${dream.dreamType}  |  Tone: ${dream.emotionalTone}`, MARGINS.left, yPos)
    yPos += 10

    // Dream excerpt/description
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(FONTS.body)
    addWrappedText(dream.excerpt, MARGINS.left, contentWidth, FONTS.body)
    yPos += 5

    // Transcript section (if available)
    if (dream.transcript) {
      checkNewPage(30)

      doc.setFontSize(FONTS.subheading)
      doc.setTextColor(...COLORS.primary)
      doc.setFont('helvetica', 'bold')
      doc.text('Transcript', MARGINS.left, yPos)
      yPos += 7

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(FONTS.body)
      doc.setTextColor(...COLORS.text)
      addWrappedText(`"${dream.transcript}"`, MARGINS.left, contentWidth, FONTS.body, COLORS.textLight)
      yPos += 5
    }

    // Analysis section (if available and requested)
    if (includeAnalysis && dream.analysis) {
      const analysis = dream.analysis

      // Overview
      checkNewPage(40)
      doc.setFontSize(FONTS.subheading)
      doc.setTextColor(...COLORS.primary)
      doc.setFont('helvetica', 'bold')
      doc.text('Dream Overview', MARGINS.left, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(FONTS.body)
      doc.setTextColor(...COLORS.text)
      doc.text(`Dream Type Confidence: ${Math.round(analysis.overview.dreamTypeConfidence * 100)}%`, MARGINS.left, yPos)
      yPos += 5
      addWrappedText(`Emotional Summary: ${analysis.overview.emotionalToneSummary}`, MARGINS.left, contentWidth, FONTS.body)
      yPos += 5

      // Manifest Content
      checkNewPage(60)
      doc.setFontSize(FONTS.subheading)
      doc.setTextColor(...COLORS.primary)
      doc.setFont('helvetica', 'bold')
      doc.text('Manifest Content', MARGINS.left, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(FONTS.body)
      doc.setTextColor(...COLORS.text)

      if (analysis.manifestContent.characters.length > 0) {
        doc.text(`Characters: ${analysis.manifestContent.characters.join(', ')}`, MARGINS.left, yPos)
        yPos += 5
      }
      if (analysis.manifestContent.settings.length > 0) {
        doc.text(`Settings: ${analysis.manifestContent.settings.join(', ')}`, MARGINS.left, yPos)
        yPos += 5
      }
      if (analysis.manifestContent.actions.length > 0) {
        doc.text(`Actions: ${analysis.manifestContent.actions.join(', ')}`, MARGINS.left, yPos)
        yPos += 5
      }
      if (analysis.manifestContent.emotions.length > 0) {
        doc.text(`Emotions: ${analysis.manifestContent.emotions.join(', ')}`, MARGINS.left, yPos)
        yPos += 5
      }
      doc.text(`Bizarreness: ${analysis.manifestContent.bizarreness}`, MARGINS.left, yPos)
      yPos += 8

      // Structural Analysis
      checkNewPage(50)
      doc.setFontSize(FONTS.subheading)
      doc.setTextColor(...COLORS.primary)
      doc.setFont('helvetica', 'bold')
      doc.text('Structural Analysis (CDT Framework)', MARGINS.left, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(FONTS.body)
      doc.setTextColor(...COLORS.text)

      addWrappedText(`Vault Activation: ${analysis.structuralAnalysis.vaultActivation}`, MARGINS.left, contentWidth, FONTS.body)
      yPos += 3

      if (analysis.structuralAnalysis.cognitiveDrift.length > 0) {
        doc.text('Cognitive Drift:', MARGINS.left, yPos)
        yPos += 5
        for (const drift of analysis.structuralAnalysis.cognitiveDrift) {
          doc.text(`  - ${drift}`, MARGINS.left, yPos)
          yPos += 5
        }
      }
      addWrappedText(`Dream Type Rationale: ${analysis.structuralAnalysis.dreamTypeRationale}`, MARGINS.left, contentWidth, FONTS.body)
      yPos += 5

      // Archetypal Resonances
      checkNewPage(50)
      doc.setFontSize(FONTS.subheading)
      doc.setTextColor(...COLORS.primary)
      doc.setFont('helvetica', 'bold')
      doc.text('Archetypal Resonances', MARGINS.left, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(FONTS.body)
      doc.setTextColor(...COLORS.text)

      if (analysis.archetypalResonances.symbols.length > 0) {
        doc.text('Symbols:', MARGINS.left, yPos)
        yPos += 5
        for (const symbol of analysis.archetypalResonances.symbols) {
          addWrappedText(`  - ${symbol}`, MARGINS.left, contentWidth - 10, FONTS.body)
        }
      }

      if (analysis.archetypalResonances.themes.length > 0) {
        doc.text(`Themes: ${analysis.archetypalResonances.themes.join(', ')}`, MARGINS.left, yPos)
        yPos += 5
      }

      if (analysis.archetypalResonances.possibleMeanings.length > 0) {
        doc.text('Possible Meanings:', MARGINS.left, yPos)
        yPos += 5
        for (const meaning of analysis.archetypalResonances.possibleMeanings) {
          addWrappedText(`  - ${meaning}`, MARGINS.left, contentWidth - 10, FONTS.body)
        }
      }
      yPos += 5

      // Reflective Prompts
      if (analysis.reflectivePrompts.length > 0) {
        checkNewPage(40)
        doc.setFontSize(FONTS.subheading)
        doc.setTextColor(...COLORS.accent)
        doc.setFont('helvetica', 'bold')
        doc.text('Reflective Prompts', MARGINS.left, yPos)
        yPos += 7

        doc.setFont('helvetica', 'italic')
        doc.setFontSize(FONTS.body)
        doc.setTextColor(...COLORS.text)

        for (const prompt of analysis.reflectivePrompts) {
          checkNewPage(15)
          addWrappedText(`"${prompt}"`, MARGINS.left + 5, contentWidth - 10, FONTS.body)
          yPos += 3
        }
      }
    }

    // Separator line
    yPos += 10
    doc.setDrawColor(...COLORS.textLight)
    doc.setLineWidth(0.5)
    doc.line(MARGINS.left, yPos, pageWidth - MARGINS.right, yPos)
    yPos += 10
  }

  // ===== FOOTER ON LAST PAGE =====
  doc.setFontSize(FONTS.small)
  doc.setTextColor(...COLORS.textLight)
  doc.text(
    'Generated by Cognitive Dream Theory - Your dreams, your insights.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Save the PDF
  const fileName = `dream-journal-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
