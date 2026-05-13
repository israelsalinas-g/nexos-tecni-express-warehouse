import { CompanyProfile, Quotation, QuotationItem } from '@/types/database.types'

export function generateQuotationHTML(
  quotation: Quotation,
  items: QuotationItem[],
  company: CompanyProfile | null,
): string {
  const formatCurrency = (n: number) =>
    `L. ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })

  const rows = items
    .map(
      (item, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${item.product_sku ?? '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${item.product_name_es}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency(item.subtotal)}</td>
      </tr>`,
    )
    .join('')

  const validUntil = quotation.valid_until
    ? `<p style="margin:4px 0;"><strong>Válida hasta:</strong> ${formatDate(quotation.valid_until)}</p>`
    : ''

  const discountRow =
    quotation.discount && quotation.discount > 0
      ? `<tr><td colspan="4" style="text-align:right;padding:6px 12px;color:#dc2626;">Descuento</td><td style="text-align:right;padding:6px 12px;color:#dc2626;">- ${formatCurrency(quotation.discount)}</td></tr>`
      : ''

  const logoHtml = company?.logo_url
    ? `<img src="${company.logo_url}" alt="Logo" style="height:56px;object-fit:contain;" />`
    : `<div style="font-size:22px;font-weight:800;color:#00542e;">${company?.business_name ?? 'Tecni-Express'}</div>`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Cotización ${quotation.quotation_number}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111827; margin: 0; padding: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #00542e; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    th:nth-child(3) { text-align: center; }
    th:nth-child(4), th:nth-child(5) { text-align: right; }
  </style>
</head>
<body>
  <!-- Header -->
  <table style="margin-bottom:32px;">
    <tr>
      <td style="width:50%;">${logoHtml}</td>
      <td style="text-align:right;">
        <div style="font-size:24px;font-weight:800;color:#00542e;margin-bottom:4px;">COTIZACIÓN</div>
        <div style="font-size:16px;font-weight:700;color:#374151;">#${quotation.quotation_number}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Fecha: ${formatDate(quotation.created_at)}</div>
      </td>
    </tr>
  </table>

  <!-- Company + Customer info -->
  <table style="margin-bottom:28px;">
    <tr>
      <td style="width:50%;vertical-align:top;">
        <div style="background:#f3f4f6;border-radius:8px;padding:14px;">
          <p style="margin:0 0 8px;font-weight:700;color:#00542e;font-size:12px;text-transform:uppercase;">De</p>
          <p style="margin:4px 0;font-weight:700;">${company?.business_name ?? 'Tecni-Express'}</p>
          ${company?.rtn ? `<p style="margin:4px 0;">RTN: ${company.rtn}</p>` : ''}
          ${company?.address ? `<p style="margin:4px 0;">${company.address}</p>` : ''}
          ${company?.phone ? `<p style="margin:4px 0;">Tel: ${company.phone}</p>` : ''}
          ${company?.email ? `<p style="margin:4px 0;">${company.email}</p>` : ''}
        </div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:16px;">
        <div style="background:#f3f4f6;border-radius:8px;padding:14px;">
          <p style="margin:0 0 8px;font-weight:700;color:#00542e;font-size:12px;text-transform:uppercase;">Para</p>
          <p style="margin:4px 0;font-weight:700;">${quotation.customer_name ?? 'Cliente'}</p>
          ${quotation.customer_email ? `<p style="margin:4px 0;">${quotation.customer_email}</p>` : ''}
          ${validUntil}
        </div>
      </td>
    </tr>
  </table>

  <!-- Items table -->
  <table style="margin-bottom:20px;">
    <thead>
      <tr>
        <th style="width:12%;">SKU</th>
        <th>Descripción</th>
        <th style="width:10%;">Cant.</th>
        <th style="width:16%;">Precio Unit.</th>
        <th style="width:16%;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Totals -->
  <table style="width:320px;margin-left:auto;margin-bottom:28px;">
    <tr>
      <td style="padding:6px 12px;color:#6b7280;">Subtotal</td>
      <td style="text-align:right;padding:6px 12px;">${formatCurrency(quotation.subtotal)}</td>
    </tr>
    ${discountRow}
    <tr>
      <td style="padding:6px 12px;color:#6b7280;">ISV (15%)</td>
      <td style="text-align:right;padding:6px 12px;">${formatCurrency(quotation.tax_amount)}</td>
    </tr>
    <tr style="border-top:2px solid #e5e7eb;">
      <td style="padding:10px 12px;font-weight:800;font-size:15px;color:#00542e;">TOTAL</td>
      <td style="text-align:right;padding:10px 12px;font-weight:800;font-size:15px;color:#00542e;">${formatCurrency(quotation.total)}</td>
    </tr>
  </table>

  ${quotation.notes ? `<div style="border-top:1px solid #e5e7eb;padding-top:16px;"><p style="font-weight:700;margin-bottom:6px;color:#374151;">Notas:</p><p style="color:#6b7280;margin:0;">${quotation.notes}</p></div>` : ''}

  <div style="margin-top:32px;text-align:center;color:#9ca3af;font-size:11px;">
    Esta cotización fue generada por ${company?.business_name ?? 'Tecni-Express'} el ${formatDate(quotation.created_at)}.
  </div>
</body>
</html>`
}
