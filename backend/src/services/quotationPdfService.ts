import pdfmake from 'pdfmake';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { Quotation, QuotationLine, Store } from '@/models';
import settingsService from '@/services/settingsService';
import CustomError from '@/utils/customError';
import { getPdfFonts } from '@/utils/pdfFonts';

const FONT_NAME = 'NotoSansJP';

/** A4 portrait — standard for Japanese 見積書 */
const PAGE = {
  size: 'A4' as const,
  orientation: 'portrait' as const,
  margins: [42, 48, 42, 52] as [number, number, number, number],
};

const COLORS = {
  text: '#1A1A1A',
  muted: '#5C5C5C',
  border: '#BFBFBF',
  headerBg: '#F3F4F6',
  accent: '#166534',
};

interface PdfLineRow {
  lineNo: number;
  productName: string;
  spec: string;
  unit: string;
  unitPrice: number;
  note: string;
}

function formatYen(value: number): string {
  return `¥${Math.round(value).toLocaleString('ja-JP')}`;
}

function formatDateJa(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(start)} ～ ${fmt(end)}`;
}

function buildDefaultSealSvg(companyName: string): string {
  const shortName = companyName.replace(/株式会社|有限会社/g, '').trim().slice(0, 4) || '印';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect x="2" y="2" width="60" height="60" fill="none" stroke="#B91C1C" stroke-width="2.5"/>
    <text x="32" y="38" text-anchor="middle" font-size="18" fill="#B91C1C" font-family="serif">${shortName}</text>
  </svg>`;
}

function buildSealContent(sealSetting: string | undefined, companyName: string): Content {
  if (sealSetting?.startsWith('data:image')) {
    return { image: sealSetting, width: 52, height: 52 };
  }
  return { svg: buildDefaultSealSvg(companyName), width: 52, height: 52 };
}

function buildTableLayout() {
  return {
    hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
      i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.4,
    vLineWidth: () => 0.4,
    hLineColor: () => COLORS.border,
    vLineColor: () => COLORS.border,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 5,
    paddingBottom: () => 5,
    fillColor: (rowIndex: number) => (rowIndex === 0 ? COLORS.headerBg : null),
  };
}

function initPdfMake() {
  pdfmake.setFonts(getPdfFonts());
  pdfmake.setLocalAccessPolicy(() => true);
}

class QuotationPdfService {
  async buildPdfData(quotationId: number) {
    const quotation = await Quotation.findByPk(quotationId, {
      include: [{ model: Store, as: 'store' }],
    });
    if (!quotation) throw new CustomError('見積書が見つかりません', 404);

    const lines = await QuotationLine.findAll({
      where: { quotationId, isVisible: true },
      order: [['lineNo', 'ASC']],
    });

    const pdfLines: PdfLineRow[] = lines.map((line) => ({
      lineNo: line.lineNo,
      productName: line.productName,
      spec: line.spec?.trim() || '—',
      unit: line.unit,
      unitPrice: Math.round(Number(line.finalQuotePrice)),
      note: line.note?.trim() || '',
    }));

    const settings = await settingsService.getSystemSettings();

    return {
      quotation,
      store: (quotation as any).store as Store,
      lines: pdfLines,
      settings,
      periodStart: new Date(quotation.periodStart),
      periodEnd: new Date(quotation.periodEnd),
      issueDate: quotation.sentAt ? new Date(quotation.sentAt) : new Date(),
    };
  }

  buildDocumentDefinition(data: Awaited<ReturnType<typeof this.buildPdfData>>): TDocumentDefinitions {
    const companyName = data.settings.company_name || '有限会社かにわ';
    const companyTel = data.settings.company_tel || '';
    const companyFax = data.settings.company_fax || '';
    const storeName = data.store?.name || '';
    const seal = buildSealContent(data.settings.company_seal, companyName);

    const subject = storeName ? `${storeName} 向け商品単価` : '商品単価一覧';

    const metaRows: TableCell[][] = [
      [
        { text: '見積番号', style: 'metaLabel' },
        { text: data.quotation.quotationNo, style: 'metaValue' },
      ],
      [
        { text: '見積日', style: 'metaLabel' },
        { text: formatDateJa(data.issueDate), style: 'metaValue' },
      ],
      [
        { text: '有効期限', style: 'metaLabel' },
        { text: formatPeriod(data.periodStart, data.periodEnd), style: 'metaValue' },
      ],
    ];

    const tableHeader: TableCell[] = [
      { text: 'No.', style: 'tableHeader', alignment: 'center' },
      { text: '品名', style: 'tableHeader' },
      { text: '規格', style: 'tableHeader', alignment: 'center' },
      { text: '単位', style: 'tableHeader', alignment: 'center' },
      { text: '単価（税抜）', style: 'tableHeader', alignment: 'right' },
      { text: '備考', style: 'tableHeader' },
    ];

    const tableBody: TableCell[][] = [tableHeader];
    if (data.lines.length === 0) {
      tableBody.push([
        { text: '見積対象の商品がありません', colSpan: 6, alignment: 'center', color: COLORS.muted, italics: true },
        {}, {}, {}, {}, {},
      ]);
    } else {
      for (const line of data.lines) {
        tableBody.push([
          { text: String(line.lineNo), alignment: 'center', fontSize: 9 },
          { text: line.productName, fontSize: 9 },
          { text: line.spec, alignment: 'center', fontSize: 9, color: COLORS.muted },
          { text: line.unit, alignment: 'center', fontSize: 9 },
          { text: formatYen(line.unitPrice), alignment: 'right', fontSize: 9, bold: true },
          { text: line.note || '—', fontSize: 8, color: COLORS.muted },
        ]);
      }
    }

    const footnotes: Content[] = [
      {
        text: '※ 本見積に記載のない商品については、都度市場相場にてご案内いたします。',
        style: 'footnote',
      },
      {
        text: '※ 天候・市況・災害等の影響により、価格を改定させていただく場合がございます。',
        style: 'footnote',
      },
    ];

    if (data.quotation.note?.trim()) {
      footnotes.push({
        text: `【備考】${data.quotation.note.trim()}`,
        style: 'footnote',
        margin: [0, 4, 0, 0],
      });
    }

    return {
      pageSize: PAGE.size,
      pageOrientation: PAGE.orientation,
      pageMargins: PAGE.margins,
      defaultStyle: { font: FONT_NAME, fontSize: 10, color: COLORS.text, lineHeight: 1.35 },
      footer: (currentPage, pageCount) => ({
        text: `${currentPage} / ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: COLORS.muted,
        margin: [0, 8, 0, 0],
      }),
      content: [
        {
          text: '見　積　書',
          style: 'docTitle',
          alignment: 'center',
          margin: [0, 0, 0, 28],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: `${storeName}　御中`,
                  style: 'addressee',
                  margin: [0, 0, 0, 14],
                },
                { text: `件名：${subject}`, style: 'subject', margin: [0, 0, 0, 16] },
                {
                  text: '平素より格別のお引き立てを賜り、厚く御礼申し上げます。',
                  style: 'greeting',
                },
                {
                  text: '下記の通りお見積り申し上げます。',
                  style: 'greeting',
                  margin: [0, 0, 0, 20],
                },
              ],
            },
            {
              width: 200,
              stack: [
                {
                  table: {
                    widths: [52, '*'],
                    body: metaRows,
                  },
                  layout: 'noBorders',
                  margin: [0, 0, 0, 12],
                },
                {
                  columns: [
                    {
                      width: '*',
                      stack: [
                        { text: companyName, style: 'companyName', alignment: 'right' },
                        ...(companyTel
                          ? [{ text: `TEL　${companyTel}`, style: 'companyContact', alignment: 'right' as const }]
                          : []),
                        ...(companyFax
                          ? [{ text: `FAX　${companyFax}`, style: 'companyContact', alignment: 'right' as const }]
                          : []),
                      ],
                    },
                    {
                      width: 58,
                      margin: [6, 2, 0, 0],
                      stack: [seal],
                    },
                  ],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            headerRows: 1,
            widths: [26, '*', 58, 38, 62, 72],
            body: tableBody,
          },
          layout: buildTableLayout(),
          margin: [0, 0, 0, 16],
        },
        ...footnotes,
      ],
      styles: {
        docTitle: { fontSize: 22, bold: true },
        addressee: { fontSize: 14, bold: true, decoration: 'underline', decorationStyle: 'solid' },
        subject: { fontSize: 10 },
        greeting: { fontSize: 9.5, color: COLORS.muted },
        metaLabel: { fontSize: 8.5, color: COLORS.muted, alignment: 'right' },
        metaValue: { fontSize: 8.5, alignment: 'left' },
        companyName: { fontSize: 10, bold: true, margin: [0, 0, 0, 2] },
        companyContact: { fontSize: 8.5, color: COLORS.muted, margin: [0, 1, 0, 0] },
        tableHeader: { fontSize: 9, bold: true, color: COLORS.text },
        footnote: { fontSize: 8, color: COLORS.muted, lineHeight: 1.5 },
      },
    };
  }

  async generateBuffer(quotationId: number): Promise<{ buffer: Buffer; filename: string }> {
    initPdfMake();
    const data = await this.buildPdfData(quotationId);
    const docDefinition = this.buildDocumentDefinition(data);
    const pdfDoc = pdfmake.createPdf(docDefinition);
    const buffer = await pdfDoc.getBuffer();
    const filename = `見積書_${data.quotation.quotationNo}.pdf`;
    return { buffer: Buffer.from(buffer), filename };
  }
}

export default new QuotationPdfService();
