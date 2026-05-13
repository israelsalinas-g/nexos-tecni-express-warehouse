Ready for review
Select text to add comments on the plan
Plan: Implementar todas las funciones del CPANEL web en la App Móvil ERP
Contexto
La app móvil nexos-tecniexpress-erp-mobile (Expo 54, expo-router 6, Supabase, TypeScript) ya tiene implementados los módulos base de bodega. El panel administrativo web (nexos-tecniexpress-website, Next.js + Supabase) tiene 19 módulos completos. El objetivo es paridad funcional con adaptaciones propias de mobile (sin tablas HTML, sin drag-and-drop, PDF via expo-print, charts via SVG).

El backend Supabase es compartido: misma base de datos, mismas tablas, mismas APIs REST de Supabase (no las API routes de Next.js).

Estado Actual de la App Móvil
Ya implementado
Módulo	Archivo(s)
Auth login	app/(auth)/login.tsx
Dashboard básico (solo stock bajo)	app/(tabs)/dashboard.tsx
Inventario (consulta + filtros)	app/(tabs)/inventory.tsx
Scanner barcode/QR	app/(tabs)/scan.tsx
Ventas — lista pending + crear orden	app/(tabs)/sales.tsx, app/sales/new.tsx
Facturación SAR	app/invoices/new.tsx
Órdenes de compra — lista + crear	app/(tabs)/purchases.tsx, app/purchases/new.tsx
Recepción de OC	app/receive/[poId].tsx
Traslados entre bodegas	app/transfers/new.tsx
Conteo físico	app/count/[sessionId].tsx
Detalle de producto (solo lectura)	app/product/[sku].tsx
Auxiliares CRUD básico	app/auxiliaries/*.tsx (8 pantallas)
Servicios (13)	services/*.service.ts
No implementado (falta completo)
Cotizaciones, Envíos, Finanzas, Crédito a Clientes, Fidelidad, Servicio Técnico, Compatibilidad, Auditoría, Reportes completos.

Implementado parcialmente (necesita mejoras)
Dashboard KPIs, Detalle de pedido, Edición de producto, Gestión de clientes.


Fase 4: Crédito + Fidelidad (Sprint 5 — 5-6 días)
F4.1 — Crédito a Clientes
Nuevos archivos:

app/credit/index.tsx — Lista de cuentas con saldo disponible + alertas vencidas
app/credit/[accountId].tsx — Detalle: límite/balance (barra progreso via View), historial transacciones
app/credit/new.tsx — Crear cuenta (modal, seleccionar cliente)
app/credit/payment/[accountId].tsx — Registrar pago (modal)
Nuevo servicio: services/credit.service.ts

static async getAll(): Promise<Array<CreditAccount & { profiles: Profile }>>
static async getById(id: string): Promise<CreditAccount & { credit_transactions: CreditTransaction[], profiles: Profile }>
static async create(c: Partial<CreditAccount>): Promise<CreditAccount>
static async updateLimit(accountId: string, newLimit: number): Promise<void>
static async registerPayment(accountId: string, amount: number, notes?: string): Promise<CreditTransaction>
static async getOverdueAccounts(): Promise<Array<CreditAccount & { profiles: Profile }>>
F4.2 — Programa de Fidelidad
Nuevos archivos:

app/loyalty/index.tsx — Lista con tier badge (bronze/silver/gold) y puntos
app/loyalty/[accountId].tsx — Detalle: barra progreso hacia next tier, historial transacciones
app/loyalty/adjust/[accountId].tsx — Ajuste manual de puntos (modal)
Nuevo servicio: services/loyalty.service.ts

static async getAll(): Promise<Array<LoyaltyAccount & { profiles: Profile }>>
static async getById(id: string): Promise<LoyaltyAccount & { loyalty_transactions: LoyaltyTransaction[], profiles: Profile }>
static async adjustPoints(accountId: string, points: number, reason: string): Promise<LoyaltyTransaction>
Modificar app/(tabs)/index.tsx: Agregar "Crédito" y "Fidelidad" al grid o submenú de módulos.

Fase 5: Servicio Técnico (Sprint 6-7 — 8-10 días)
F5.1 — Tickets de Servicio Técnico
Nuevos archivos:

app/service/index.tsx — Toggle Lista / Kanban (columnas por estado en ScrollView horizontal)
app/service/[ticketId].tsx — Detalle: electrodoméstico, diagnóstico, repuestos, historial estados
app/service/new.tsx — Crear ticket en 3 pasos: Cliente → Electrodoméstico → Asignación
app/service/edit/[ticketId].tsx — Editar ticket (modal)
app/service/parts/[ticketId].tsx — Gestión de repuestos del ticket (modal)
Nuevo servicio: services/service-ticket.service.ts

static async getAll(status?: string): Promise<ServiceTicket[]>
static async getById(id: string): Promise<ServiceTicket & { ticket_parts: TicketPart[], ticket_status_history: TicketStatusHistory[], profiles: Profile }>
static async create(t: Partial<ServiceTicket>): Promise<ServiceTicket>
static async update(id: string, t: Partial<ServiceTicket>): Promise<ServiceTicket>
static async updateStatus(id: string, status: TicketStatus, note?: string): Promise<void>
static async addPart(ticketId: string, part: Partial<TicketPart>): Promise<TicketPart>
static async removePart(partId: string): Promise<void>
Estados de ticket: received → diagnosed → awaiting_approval → in_repair → ready → delivered → cancelled

Vista Kanban mobile: ScrollView horizontal con 7 columnas. Cada columna tiene un FlatList vertical de cards compactos. El cambio de estado se hace desde la pantalla de detalle del ticket, no con drag-and-drop.

Modificar app/(tabs)/index.tsx: Agregar "Servicio Técnico" al grid (icono tools, color #8b5cf6).

Fase 6: Reportes con Gráficos (Sprint 8 — 5-7 días)
F6.1 — Módulo Reportes Completo
Nuevos archivos:

app/reports/index.tsx — Hub con 4 reportes disponibles
app/reports/sales.tsx — Ventas: KPIs + VictoryBar por período + VictoryPie por método pago + top 10 productos
app/reports/inventory.tsx — Inventario: stock total, productos bajo mínimo, rotación estimada
app/reports/customers.tsx — Clientes: nuevos, recurrentes, top compradores
app/reports/finance.tsx — Financiero: ingresos vs egresos, margen bruto
Nuevo servicio: services/reports.service.ts

static async getSalesReport(from: string, to: string): Promise<SalesReport>
static async getInventoryReport(): Promise<InventoryReport>
static async getCustomerReport(from: string, to: string): Promise<CustomerReport>
static async getFinanceReport(from: string, to: string): Promise<FinanceReport>
static async exportToCSV(data: Record<string, any>[], headers: string[]): Promise<string>  // URI via expo-sharing
Charts con Victory Native v41:

import { VictoryBar, VictoryLine, VictoryChart, VictoryAxis, VictoryPie } from 'victory-native'
// Victory Native v41 funciona sin Reanimated 3 usando la API legacy
Modificar app/(tabs)/index.tsx: Agregar "Reportes" al grid (icono chart-bar, color #3b82f6).

Fase 7: Compatibilidad + Auditoría (Sprint 9 — 3-4 días)
F7.1 — Compatibilidad de Repuestos
Nuevos archivos:

app/compatibility/index.tsx — Búsqueda: qué modelos son compatibles con un SKU
app/compatibility/models/index.tsx — CRUD de modelos de electrodoméstico
app/compatibility/models/new.tsx — Crear/editar modelo (modal)
Nuevo servicio: services/compatibility.service.ts

static async getModels(brandId?: string): Promise<ApplianceModel[]>
static async createModel(m: Partial<ApplianceModel>): Promise<ApplianceModel>
static async getCompatibleModels(productId: string): Promise<ApplianceModel[]>
static async addCompatibility(productId: string, modelId: string): Promise<void>
static async removeCompatibility(productId: string, modelId: string): Promise<void>
F7.2 — Auditoría (Solo Lectura)
Nuevo archivo: app/audit/index.tsx

Solo lectura. FlashList de audit_log con filtros por usuario, entidad y fecha. Cards expandibles que muestran old_values/new_values como JSON formateado.

Nuevo servicio: services/audit.service.ts

static async getAll(params?: { userId?, entityType?, from?, to?, limit? }): Promise<AuditLog[]>
Modificaciones a Archivos Existentes
app/_layout.tsx
Agregar después de los Screen existentes:

// Pedidos
<Stack.Screen name="orders/[orderId]" options={{ headerShown: true, title: 'Pedido' }} />
// Cotizaciones
<Stack.Screen name="quotations/index" options={{ headerShown: false }} />
<Stack.Screen name="quotations/[id]" options={{ headerShown: true, title: 'Cotización' }} />
<Stack.Screen name="quotations/new" options={{ headerShown: false, presentation: 'modal' }} />
<Stack.Screen name="quotations/edit/[id]" options={{ headerShown: false, presentation: 'modal' }} />
// Envíos
<Stack.Screen name="shipments/index" options={{ headerShown: false }} />
<Stack.Screen name="shipments/[id]" options={{ headerShown: true, title: 'Envío' }} />
<Stack.Screen name="shipments/new" options={{ headerShown: false, presentation: 'modal' }} />
// Finanzas
<Stack.Screen name="finance/index" options={{ headerShown: false }} />
<Stack.Screen name="finance/expenses/index" options={{ headerShown: false }} />
<Stack.Screen name="finance/expenses/new" options={{ headerShown: false, presentation: 'modal' }} />
<Stack.Screen name="finance/receivables/index" options={{ headerShown: false }} />
<Stack.Screen name="finance/payables/index" options={{ headerShown: false }} />
<Stack.Screen name="finance/balance/index" options={{ headerShown: false }} />
// Crédito
<Stack.Screen name="credit/index" options={{ headerShown: false }} />
<Stack.Screen name="credit/[accountId]" options={{ headerShown: true, title: 'Cuenta de Crédito' }} />
<Stack.Screen name="credit/new" options={{ headerShown: false, presentation: 'modal' }} />
<Stack.Screen name="credit/payment/[accountId]" options={{ headerShown: false, presentation: 'modal' }} />
// Fidelidad
<Stack.Screen name="loyalty/index" options={{ headerShown: false }} />
<Stack.Screen name="loyalty/[accountId]" options={{ headerShown: true, title: 'Programa de Fidelidad' }} />
<Stack.Screen name="loyalty/adjust/[accountId]" options={{ headerShown: false, presentation: 'modal' }} />
// Servicio Técnico
<Stack.Screen name="service/index" options={{ headerShown: false }} />
<Stack.Screen name="service/[ticketId]" options={{ headerShown: true, title: 'Ticket de Servicio' }} />
<Stack.Screen name="service/new" options={{ headerShown: false, presentation: 'modal' }} />
<Stack.Screen name="service/parts/[ticketId]" options={{ headerShown: false, presentation: 'modal' }} />
// Reportes
<Stack.Screen name="reports/index" options={{ headerShown: false }} />
<Stack.Screen name="reports/sales" options={{ headerShown: true, title: 'Reporte de Ventas' }} />
<Stack.Screen name="reports/inventory" options={{ headerShown: true, title: 'Reporte de Inventario' }} />
<Stack.Screen name="reports/finance" options={{ headerShown: true, title: 'Reporte Financiero' }} />
// Compatibilidad y Auditoría
<Stack.Screen name="compatibility/index" options={{ headerShown: false }} />
<Stack.Screen name="compatibility/models/index" options={{ headerShown: false }} />
<Stack.Screen name="audit/index" options={{ headerShown: false }} />
// Producto (edición)
<Stack.Screen name="product/edit/[sku]" options={{ headerShown: false, presentation: 'modal' }} />
app/(tabs)/index.tsx
Expandir el grid de módulos para incluir los nuevos módulos con icono y color por fase.

app/auxiliaries/customers.tsx
Agregar acceso al historial de órdenes del cliente y a su cuenta de crédito/fidelidad cuando existan.

Resumen de Archivos
Categoría	Cantidad
Nuevas pantallas	~42
Nuevos servicios	12
Componentes comunes nuevos	10
Archivos existentes modificados	~8
Templates PDF	1
Total	~73 archivos
Dependencias entre Módulos
Paso 0 (componentes comunes + tipos)
    ↓
Fase 1 (Dashboard KPIs + Pedidos + Editar Producto)
    ↓
Fase 2 (Cotizaciones → necesita Orders; Envíos → necesita Orders)
    ↓
Fase 3 (Finanzas → necesita Orders y Expenses)
    ↓
Fase 4 (Crédito → usa credit_accounts; Fidelidad → independiente)
Fase 5 (Servicio Técnico → independiente, usa Products y Profiles)
    ↓
Fase 6 (Reportes → necesita Finanzas + Cotizaciones + Orders completados)
    ↓
Fase 7 (Compatibilidad → independiente; Auditoría → independiente)
Verificación End-to-End
Para verificar cada módulo implementado:

Cotizaciones: Crear cotización → marcar como enviada → aceptar → convertir a orden → verificar que aparece en lista de pedidos
Envíos: Confirmar orden → crear envío → actualizar estado hasta delivered → verificar que orden cambia a delivered
Gastos: Crear gasto → verificar que aparece en balance de cashflow
Crédito: Crear cuenta de crédito para cliente → registrar cargo al hacer venta → verificar en cuentas por cobrar → registrar pago → verificar balance actualizado
Servicio Técnico: Crear ticket → cambiar estados hasta delivered → agregar repuestos → verificar costo calculado
Reportes: Seleccionar período → verificar que VictoryBar muestra datos consistentes con los datos de orders
PDF Cotización: Generar PDF → expo-sharing abre sheet de compartir del OS con el PDF