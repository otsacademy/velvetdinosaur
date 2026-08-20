import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/export.ts');

import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { SupportTicketSummary, SupportTicketThread } from '@/lib/support/tickets';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function csvCell(value: unknown) {
  const raw = value == null ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function xmlCell(value: unknown) {
  const raw = value == null ? '' : String(value);
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapByLength(text: string, maxLength = 104) {
  if (!text) return [''];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${current} ${words[index]}`;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = words[index];
  }

  lines.push(current);
  return lines;
}

export function buildSupportTicketsCsv(items: SupportTicketSummary[]) {
  const lines: string[] = [];
  lines.push(
    [
      'ticketRef',
      'ticketId',
      'subject',
      'organization',
      'category',
      'status',
      'priority',
      'waitingOn',
      'createdByEmail',
      'module',
      'requestedDate',
      'lastActivityAt',
      'closedAt',
      'messageCount',
      'caseRefs',
      'pageUrl',
      'createdAt',
      'updatedAt',
      'satisfactionRating',
      'satisfactionComment'
    ].join(',')
  );

  for (const item of items) {
    lines.push(
      [
        csvCell(item.ticketRef),
        csvCell(item.id),
        csvCell(item.subject),
        csvCell(item.organization),
        csvCell(item.categoryLabel),
        csvCell(item.statusLabel),
        csvCell(item.priorityLabel),
        csvCell(item.waitingOn),
        csvCell(item.createdByEmail),
        csvCell(item.module),
        csvCell(item.requestedDate || ''),
        csvCell(item.lastActivityAt || ''),
        csvCell(item.closedAt || ''),
        csvCell(item.messageCount),
        csvCell(item.caseRefs.join(' | ')),
        csvCell(item.pageUrl),
        csvCell(item.createdAt || ''),
        csvCell(item.updatedAt || ''),
        csvCell(item.satisfactionRating ?? ''),
        csvCell(item.satisfactionComment || '')
      ].join(',')
    );
  }

  return lines.join('\n');
}

export function buildSupportTicketsExcelXml(items: SupportTicketSummary[]) {
  const rows = [
    [
      'ticketRef',
      'ticketId',
      'subject',
      'organization',
      'category',
      'status',
      'priority',
      'waitingOn',
      'createdByEmail',
      'module',
      'requestedDate',
      'lastActivityAt',
      'closedAt',
      'messageCount',
      'caseRefs',
      'pageUrl',
      'createdAt',
      'updatedAt',
      'satisfactionRating',
      'satisfactionComment'
    ],
    ...items.map((item) => [
      item.ticketRef,
      item.id,
      item.subject,
      item.organization,
      item.categoryLabel,
      item.statusLabel,
      item.priorityLabel,
      item.waitingOn,
      item.createdByEmail,
      item.module,
      item.requestedDate || '',
      item.lastActivityAt || '',
      item.closedAt || '',
      String(item.messageCount),
      item.caseRefs.join(' | '),
      item.pageUrl,
      item.createdAt || '',
      item.updatedAt || '',
      item.satisfactionRating == null ? '' : String(item.satisfactionRating),
      item.satisfactionComment || ''
    ])
  ];

  const tableRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${xmlCell(cell)}</Data></Cell>`)
          .join('')}</Row>`
    )
    .join('');

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Support Tickets">
  <Table>${tableRows}</Table>
 </Worksheet>
</Workbook>`;
}

export async function buildSupportTicketsPdf(items: SupportTicketSummary[]) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 38;
  const lineHeight = 13;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  const drawLine = (text: string, strong = false) => {
    if (cursorY <= margin + 16) {
      page = pdf.addPage([pageWidth, pageHeight]);
      cursorY = pageHeight - margin;
    }

    page.drawText(text, {
      x: margin,
      y: cursorY,
      size: strong ? 10.5 : 9,
      font: strong ? bold : regular
    });
    cursorY -= lineHeight;
  };

  drawLine('Support Ticket Export', true);
  drawLine(`Generated: ${new Date().toISOString()}`);
  drawLine(`Rows: ${items.length}`);
  drawLine('');

  for (const ticket of items) {
    drawLine(`${ticket.ticketRef} · ${ticket.subject}`, true);
    const detailLines = [
      `Organization: ${ticket.organization}`,
      `Status: ${ticket.statusLabel} · Waiting on: ${ticket.waitingOn}`,
      `Category: ${ticket.categoryLabel} · Priority: ${ticket.priorityLabel}`,
      `Requester: ${ticket.createdByEmail}`,
      `Module: ${ticket.module || '-'}`,
      `Requested date: ${ticket.requestedDate || '-'}`,
      `Last activity: ${ticket.lastActivityAt || '-'} · Closed: ${ticket.closedAt || '-'}`,
      `Case refs: ${ticket.caseRefs.join(', ') || '-'}`,
      `Page URL: ${ticket.pageUrl || '-'}`,
      `Satisfaction: ${ticket.satisfactionRating ?? '-'} ${ticket.satisfactionComment ? `(${ticket.satisfactionComment})` : ''}`
    ];

    for (const line of detailLines) {
      for (const wrapped of wrapByLength(clean(line), 98)) {
        drawLine(wrapped);
      }
    }
    drawLine('');
  }

  return pdf.save();
}

export function buildSupportEvidenceCsv(threads: SupportTicketThread[]) {
  const lines: string[] = [];
  lines.push(
    [
      'ticketRef',
      'ticketId',
      'recordType',
      'recordId',
      'timestamp',
      'actorEmail',
      'actorRole',
      'status',
      'waitingOn',
      'subject',
      'body',
      'meta'
    ].join(',')
  );

  for (const thread of threads) {
    lines.push(
      [
        csvCell(thread.ticket.ticketRef),
        csvCell(thread.ticket.id),
        csvCell('ticket'),
        csvCell(thread.ticket.id),
        csvCell(thread.ticket.updatedAt || thread.ticket.createdAt || ''),
        csvCell(thread.ticket.createdByEmail),
        csvCell('admin-requester'),
        csvCell(thread.ticket.status),
        csvCell(thread.ticket.waitingOn),
        csvCell(thread.ticket.subject),
        csvCell(thread.ticket.descriptionText),
        csvCell(
          JSON.stringify({
            category: thread.ticket.category,
            module: thread.ticket.module,
            priority: thread.ticket.priority,
            caseRefs: thread.ticket.caseRefs
          })
        )
      ].join(',')
    );

    for (const message of thread.messages) {
      lines.push(
        [
          csvCell(thread.ticket.ticketRef),
          csvCell(thread.ticket.id),
          csvCell('message'),
          csvCell(message.id),
          csvCell(message.createdAt || ''),
          csvCell(message.authorEmail),
          csvCell(message.authorRole),
          csvCell(''),
          csvCell(''),
          csvCell(''),
          csvCell(message.bodyText),
          csvCell(JSON.stringify({ attachments: message.attachments.map((item) => item.url) }))
        ].join(',')
      );
    }

    for (const event of thread.events) {
      lines.push(
        [
          csvCell(thread.ticket.ticketRef),
          csvCell(thread.ticket.id),
          csvCell('event'),
          csvCell(event.id),
          csvCell(event.createdAt || ''),
          csvCell(event.actorEmail),
          csvCell(event.actorRole),
          csvCell(event.toStatus || event.fromStatus),
          csvCell(event.toWaitingOn || event.fromWaitingOn),
          csvCell(event.eventType),
          csvCell(event.message),
          csvCell(JSON.stringify(event.metadata || {}))
        ].join(',')
      );
    }

    for (const rating of thread.ratings) {
      lines.push(
        [
          csvCell(thread.ticket.ticketRef),
          csvCell(thread.ticket.id),
          csvCell('rating'),
          csvCell(rating.id),
          csvCell(rating.submittedAt || rating.createdAt || ''),
          csvCell(''),
          csvCell('admin-requester'),
          csvCell(thread.ticket.status),
          csvCell(thread.ticket.waitingOn),
          csvCell(`${rating.rating}/5`),
          csvCell(rating.comment),
          csvCell(JSON.stringify({ submittedByUserId: rating.submittedByUserId }))
        ].join(',')
      );
    }
  }

  return lines.join('\n');
}
