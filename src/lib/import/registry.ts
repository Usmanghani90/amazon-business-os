// Import module registry — single source of truth for columns, templates,
// and validation across every bulk-import target. Adding a module = one entry.

export type ColType = "string" | "number" | "date" | "enum";

export interface ColumnDef {
  field: string;
  header: string;
  type: ColType;
  required?: boolean;
  example: string | number;
  enumValues?: string[];
  note?: string;
}

export interface ModuleDef {
  key: string;
  label: string;
  /** Whether the full import pipeline (validate → commit) is wired. */
  implemented: boolean;
  columns: ColumnDef[];
}

const PAYMENT_METHODS = ["BANK_TRANSFER", "WISE", "PAYONEER", "MERCURY", "CREDIT_CARD", "CASH", "PAYPAL", "CHEQUE", "OTHER"];

export const MODULES: Record<string, ModuleDef> = {
  expenses: {
    key: "expenses",
    label: "Expenses",
    implemented: true,
    columns: [
      { field: "date", header: "Date", type: "date", required: true, example: "2026-01-15" },
      { field: "category", header: "Category", type: "string", required: true, example: "Amazon PPC", note: "Must match an existing expense category" },
      { field: "amount", header: "Amount", type: "number", required: true, example: 1250.5 },
      { field: "currency", header: "Currency", type: "string", example: "USD" },
      { field: "partner", header: "Partner Paid", type: "string", example: "Tahseen", note: "Existing partner name" },
      { field: "supplier", header: "Supplier", type: "string", example: "Shenzhen Prime Manufacturing" },
      { field: "bank", header: "Bank", type: "string", example: "Business Checking" },
      { field: "paymentMethod", header: "Payment Method", type: "enum", enumValues: PAYMENT_METHODS, example: "WISE" },
      { field: "invoiceNumber", header: "Invoice Number", type: "string", example: "INV-10234" },
      { field: "marketplace", header: "Marketplace", type: "string", example: "US" },
      { field: "notes", header: "Notes", type: "string", example: "Q1 ad spend" },
    ],
  },
  investments: {
    key: "investments",
    label: "Investments",
    implemented: true,
    columns: [
      { field: "date", header: "Date", type: "date", required: true, example: "2026-01-05" },
      { field: "partner", header: "Partner", type: "string", required: true, example: "Usman" },
      { field: "amount", header: "Amount", type: "number", required: true, example: 25000 },
      { field: "currency", header: "Currency", type: "string", example: "USD" },
      { field: "paymentMethod", header: "Payment Method", type: "enum", enumValues: PAYMENT_METHODS, example: "BANK_TRANSFER" },
      { field: "bank", header: "Bank", type: "string", example: "Business Checking" },
      { field: "referenceNumber", header: "Reference Number", type: "string", example: "INV-55012" },
      { field: "notes", header: "Notes", type: "string", example: "Follow-on funding" },
    ],
  },
  withdrawals: {
    key: "withdrawals",
    label: "Withdrawals",
    implemented: true,
    columns: [
      { field: "date", header: "Date", type: "date", required: true, example: "2026-02-01" },
      { field: "partner", header: "Partner", type: "string", required: true, example: "Ali Nisar" },
      { field: "amount", header: "Amount", type: "number", required: true, example: 8000 },
      { field: "currency", header: "Currency", type: "string", example: "USD" },
      { field: "bank", header: "Bank", type: "string", example: "Business Checking" },
      { field: "reason", header: "Reason", type: "string", example: "Profit distribution" },
      { field: "notes", header: "Notes", type: "string", example: "" },
    ],
  },
  suppliers: {
    key: "suppliers",
    label: "Suppliers",
    implemented: true,
    columns: [
      { field: "companyName", header: "Company Name", type: "string", required: true, example: "Guangzhou Home Goods Co." },
      { field: "country", header: "Country", type: "string", example: "China" },
      { field: "contactPerson", header: "Contact Person", type: "string", example: "David Wu" },
      { field: "phone", header: "Phone", type: "string", example: "+86 20 8765 4321" },
      { field: "email", header: "Email", type: "string", example: "david@gzhome.cn" },
      { field: "leadTimeDays", header: "Lead Time (days)", type: "number", example: 28 },
      { field: "paymentTerms", header: "Payment Terms", type: "string", example: "50% / 50%" },
      { field: "notes", header: "Notes", type: "string", example: "" },
    ],
  },
  products: {
    key: "products",
    label: "Products",
    implemented: false,
    columns: [
      { field: "name", header: "Name", type: "string", required: true, example: "Bamboo Cutting Board Set" },
      { field: "sku", header: "SKU", type: "string", required: true, example: "SKU-1008" },
      { field: "asin", header: "ASIN", type: "string", example: "B0ABC12345" },
      { field: "fnsku", header: "FNSKU", type: "string", example: "X001234567" },
      { field: "marketplace", header: "Marketplace", type: "string", example: "US" },
      { field: "brand", header: "Brand", type: "string", example: "KitchenNest" },
      { field: "category", header: "Category", type: "string", example: "Kitchen" },
      { field: "supplier", header: "Supplier", type: "string", example: "Shenzhen Prime Manufacturing" },
      { field: "costPrice", header: "Cost Price", type: "number", example: 6.2 },
      { field: "sellingPrice", header: "Selling Price", type: "number", example: 34.99 },
      { field: "launchDate", header: "Launch Date", type: "date", example: "2025-09-01" },
    ],
  },
  inventory: {
    key: "inventory",
    label: "Inventory",
    implemented: false,
    columns: [
      { field: "sku", header: "SKU", type: "string", required: true, example: "SKU-1008" },
      { field: "fulfillable", header: "Fulfillable", type: "number", example: 1200 },
      { field: "inbound", header: "Inbound", type: "number", example: 500 },
      { field: "reserved", header: "Reserved", type: "number", example: 40 },
      { field: "dailyVelocity", header: "Daily Velocity", type: "number", example: 22 },
      { field: "reorderPoint", header: "Reorder Point", type: "number", example: 900 },
      { field: "restockQty", header: "Restock Qty", type: "number", example: 2000 },
    ],
  },
  sales: {
    key: "sales",
    label: "Amazon Sales",
    implemented: false,
    columns: [
      { field: "date", header: "Date", type: "date", required: true, example: "2026-01-15" },
      { field: "sku", header: "SKU", type: "string", required: true, example: "SKU-1008" },
      { field: "marketplace", header: "Marketplace", type: "string", required: true, example: "US" },
      { field: "units", header: "Units", type: "number", example: 34 },
      { field: "orders", header: "Orders", type: "number", example: 33 },
      { field: "revenue", header: "Revenue", type: "number", example: 1189.66 },
      { field: "sessions", header: "Sessions", type: "number", example: 620 },
      { field: "refundAmount", header: "Refund Amount", type: "number", example: 24.5 },
    ],
  },
  payouts: {
    key: "payouts",
    label: "Amazon Payouts",
    implemented: false,
    columns: [
      { field: "marketplace", header: "Marketplace", type: "string", required: true, example: "US" },
      { field: "settlementId", header: "Settlement ID", type: "string", example: "SETTLE-20012" },
      { field: "startDate", header: "Start Date", type: "date", example: "2026-01-01" },
      { field: "endDate", header: "End Date", type: "date", required: true, example: "2026-01-14" },
      { field: "depositDate", header: "Deposit Date", type: "date", example: "2026-01-16" },
      { field: "grossSales", header: "Gross Sales", type: "number", example: 45000 },
      { field: "amazonFees", header: "Amazon Fees", type: "number", example: 14000 },
      { field: "refunds", header: "Refunds", type: "number", example: 900 },
      { field: "amount", header: "Net Amount", type: "number", required: true, example: 30100 },
    ],
  },
  "purchase-orders": {
    key: "purchase-orders",
    label: "Purchase Orders",
    implemented: false,
    columns: [
      { field: "poNumber", header: "PO Number", type: "string", required: true, example: "PO-2024010" },
      { field: "supplier", header: "Supplier", type: "string", required: true, example: "Shenzhen Prime Manufacturing" },
      { field: "status", header: "Status", type: "string", example: "ORDERED" },
      { field: "orderDate", header: "Order Date", type: "date", example: "2026-01-10" },
      { field: "expectedDelivery", header: "Expected Delivery", type: "date", example: "2026-02-20" },
      { field: "sku", header: "SKU", type: "string", required: true, example: "SKU-1008" },
      { field: "quantity", header: "Quantity", type: "number", example: 2000 },
      { field: "unitCost", header: "Unit Cost", type: "number", example: 6.2 },
      { field: "shippingCost", header: "Shipping Cost", type: "number", example: 1800 },
    ],
  },
};

export const IMPORTABLE_KEYS = Object.keys(MODULES);
