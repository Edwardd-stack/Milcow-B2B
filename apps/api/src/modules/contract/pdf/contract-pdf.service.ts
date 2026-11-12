import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { ContractInfo, Locale } from '@milcow/shared';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../../libs/prisma/prisma.service';
import { koreaToday } from '../../../libs/utils/date.util';
import { PDF_LABELS, SUPPLIER, type PdfLabels } from './contract-pdf.labels';

const FONT_DIR = join(process.cwd(), 'assets', 'fonts');
const FONTS = {
  regular: join(FONT_DIR, 'NotoSansKR-Regular.ttf'),
  bold: join(FONT_DIR, 'NotoSansKR-Bold.ttf'),
};

const PAGE = { margin: 50, width: 595.28 }; // A4 in points
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const LABEL_WIDTH = 150;
const COLOR = { brand: '#1F4E79', text: '#222222', muted: '#6B7280', line: '#D1D5DB' };

interface PdfBuyer {
  companyName: string | null;
  bizNo: string | null;
  email: string;
  phone: string | null;
}

/**
 * Draws the contract as a PDF, in memory.
 * Generated on request (not stored) → always matches the current contract data.
 */
@Injectable()
export class ContractPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async render(contract: ContractInfo, locale: Locale): Promise<Buffer> {
    if (!existsSync(FONTS.regular) || !existsSync(FONTS.bold)) {
      throw new InternalServerErrorException(
        'PDF fonts are missing (see apps/api/assets/fonts/README.md)',
      );
    }
    const [member, warehouse] = await Promise.all([
      this.prisma.member.findUniqueOrThrow({ where: { id: contract.memberId } }),
      this.prisma.warehouse.findUniqueOrThrow({ where: { id: contract.warehouse.id } }),
    ]);
    const buyer: PdfBuyer = {
      companyName: member.memberCompanyName,
      bizNo: member.memberBizNo,
      email: member.memberEmail,
      phone: member.memberPhone,
    };

    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE.margin,
      bufferPages: true,
      info: { Title: `Milcow contract ${contract.id}` },
    });
    doc.registerFont('regular', FONTS.regular);
    doc.registerFont('bold', FONTS.bold);

    // Collect the stream into one Buffer — errors then become a normal HTTP error
    const chunks: Buffer[] = [];
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.draw(doc, contract, buyer, warehouse.warehouseAddress, PDF_LABELS[locale], locale);
    doc.end();
    return done;
  }

  private draw(
    doc: PDFKit.PDFDocument,
    c: ContractInfo,
    buyer: PdfBuyer,
    warehouseAddress: string,
    t: PdfLabels,
    locale: Locale,
  ) {
    const money = (n: number) => `${n.toLocaleString('en-US')} ${t.won}`;
    const serviceFee = c.services.reduce((sum, s) => sum + s.servicePrice, 0);

    // ── Header ──
    doc.font('bold').fontSize(18).fillColor(COLOR.brand).text(t.title, { align: 'center' });
    doc.moveDown(0.4);
    doc
      .font('regular')
      .fontSize(9)
      .fillColor(COLOR.muted)
      .text(
        `${t.contractNo}: ${c.id.slice(-12).toUpperCase()}   ·   ${t.status}: ${c.contractStatus}   ·   ${t.issued}: ${koreaToday()}`,
        { align: 'center' },
      );
    doc.moveDown(1);

    // ── 1. Parties ──
    this.section(doc, t.parties);
    this.row(
      doc,
      t.supplier,
      `${SUPPLIER.name}\n${t.bizNo}: ${SUPPLIER.bizNo} · ${SUPPLIER.contact}`,
    );
    this.row(
      doc,
      t.buyer,
      [
        buyer.companyName ?? buyer.email,
        buyer.bizNo ? `${t.bizNo}: ${buyer.bizNo}` : null,
        `${t.contact}: ${[buyer.email, buyer.phone].filter(Boolean).join(' · ')}`,
      ]
        .filter(Boolean)
        .join('\n'),
    );

    // ── 2. Supply terms ──
    this.section(doc, t.terms);
    this.row(doc, t.product, c.product.productName[locale]);
    this.row(doc, t.warehouse, `${c.warehouse.warehouseName[locale]}\n${warehouseAddress}`);
    this.row(doc, t.deliveryType, t[c.contractDeliveryType]);
    if (c.contractDeliveryType === 'DELIVERY' && c.contractAddress)
      this.row(doc, t.address, c.contractAddress);
    this.row(doc, t.monthlyTon, `${c.contractMonthlyTon} ${t.ton}`);
    this.row(doc, t.pricePerTon, money(c.contractPricePerTon));
    this.row(doc, t.period, `${c.contractStart} ~ ${c.contractEnd}`);
    this.row(doc, t.deliveries, `${c.contractDeliveryDates.length} ${t.times}`.trim());

    // ── 3. Add-on services ──
    this.section(doc, t.services);
    if (c.services.length === 0) this.row(doc, '—', t.noServices);
    for (const s of c.services) this.row(doc, s.serviceName[locale], money(s.servicePrice));

    // ── 4. Amounts ──
    this.section(doc, t.amounts);
    this.row(doc, t.monthlyProduct, money(c.contractMonthlyTotal - serviceFee));
    this.row(doc, t.monthlyServices, money(serviceFee));
    this.row(doc, t.monthlyTotal, money(c.contractMonthlyTotal));
    this.row(doc, t.contractTotal, money(c.contractTotal), true);

    // ── 5. Schedule: dates in 4 columns ──
    this.section(doc, t.schedule);
    const columns = 4;
    const colWidth = CONTENT_WIDTH / columns;
    const top = doc.y;
    doc.font('regular').fontSize(9).fillColor(COLOR.text);
    c.contractDeliveryDates.forEach((date, i) => {
      const x = PAGE.margin + (i % columns) * colWidth;
      const y = top + Math.floor(i / columns) * 14;
      doc.text(`${String(i + 1).padStart(2, '0')}.  ${date}`, x, y, {
        width: colWidth,
        lineBreak: false,
      });
    });
    doc.x = PAGE.margin;
    doc.y = top + Math.ceil(c.contractDeliveryDates.length / columns) * 14 + 4;

    // ── 6. General terms ──
    this.section(doc, t.clausesTitle);
    doc.font('regular').fontSize(9.5).fillColor(COLOR.text);
    t.clauses.forEach((clause, i) =>
      doc.text(`${i + 1}) ${clause}`, { width: CONTENT_WIDTH }).moveDown(0.2),
    );

    // ── Signatures ──
    if (doc.y > 680) doc.addPage();
    this.section(doc, t.signatures);
    const sigTop = doc.y + 6;
    const boxWidth = (CONTENT_WIDTH - 20) / 2;
    [
      { label: t.supplier, name: SUPPLIER.name },
      { label: t.buyer, name: buyer.companyName ?? buyer.email },
    ].forEach((party, i) => {
      const x = PAGE.margin + i * (boxWidth + 20);
      doc.roundedRect(x, sigTop, boxWidth, 70, 4).strokeColor(COLOR.line).stroke();
      doc
        .font('bold')
        .fontSize(9)
        .fillColor(COLOR.muted)
        .text(party.label, x + 10, sigTop + 8);
      doc
        .font('regular')
        .fontSize(10)
        .fillColor(COLOR.text)
        .text(party.name, x + 10, sigTop + 24, { width: boxWidth - 20 });
      doc
        .fontSize(9)
        .fillColor(COLOR.muted)
        .text('(인 / Sign)', x + boxWidth - 70, sigTop + 50);
    });

    // ── Footer on every page ──
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0; // writing below the margin must not open a new page
      doc
        .font('regular')
        .fontSize(8)
        .fillColor(COLOR.muted)
        .text(`${t.footer}   ${i + 1}/${range.count}`, PAGE.margin, 800, {
          width: CONTENT_WIDTH,
          align: 'center',
          lineBreak: false,
        });
    }
  }

  private section(doc: PDFKit.PDFDocument, title: string) {
    if (doc.y > 740) doc.addPage();
    doc.moveDown(0.6);
    doc.font('bold').fontSize(11).fillColor(COLOR.brand).text(title, PAGE.margin);
    const y = doc.y + 2;
    doc
      .moveTo(PAGE.margin, y)
      .lineTo(PAGE.margin + CONTENT_WIDTH, y)
      .strokeColor(COLOR.line)
      .stroke();
    doc.y = y + 6;
  }

  /** Label on the left, value on the right; the row grows with the longer side */
  private row(doc: PDFKit.PDFDocument, label: string, value: string, strong = false) {
    if (doc.y > 760) doc.addPage();
    const top = doc.y;
    doc
      .font('regular')
      .fontSize(9.5)
      .fillColor(COLOR.muted)
      .text(label, PAGE.margin, top, { width: LABEL_WIDTH - 10 });
    const labelBottom = doc.y;
    doc
      .font(strong ? 'bold' : 'regular')
      .fontSize(strong ? 11 : 10)
      .fillColor(COLOR.text)
      .text(value, PAGE.margin + LABEL_WIDTH, top, { width: CONTENT_WIDTH - LABEL_WIDTH });
    doc.x = PAGE.margin;
    doc.y = Math.max(labelBottom, doc.y) + 4;
  }
}
