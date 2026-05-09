[
  {
    "table_name": "categories",
    "column_name": "parent_id",
    "foreign_table_name": "categories",
    "foreign_column_name": "id"
  },
  {
    "table_name": "products",
    "column_name": "category_id",
    "foreign_table_name": "categories",
    "foreign_column_name": "id"
  },
  {
    "table_name": "products",
    "column_name": "brand_id",
    "foreign_table_name": "brands",
    "foreign_column_name": "id"
  },
  {
    "table_name": "product_images",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "orders",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "order_items",
    "column_name": "order_id",
    "foreign_table_name": "orders",
    "foreign_column_name": "id"
  },
  {
    "table_name": "order_items",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "order_status_history",
    "column_name": "order_id",
    "foreign_table_name": "orders",
    "foreign_column_name": "id"
  },
  {
    "table_name": "order_status_history",
    "column_name": "changed_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "ticket_parts",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "customer_type_requests",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "customer_type_requests",
    "column_name": "reviewed_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory",
    "column_name": "warehouse_id",
    "foreign_table_name": "warehouses",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_movements",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_movements",
    "column_name": "warehouse_id",
    "foreign_table_name": "warehouses",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_movements",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "purchase_orders",
    "column_name": "supplier_id",
    "foreign_table_name": "suppliers",
    "foreign_column_name": "id"
  },
  {
    "table_name": "purchase_orders",
    "column_name": "warehouse_id",
    "foreign_table_name": "warehouses",
    "foreign_column_name": "id"
  },
  {
    "table_name": "purchase_orders",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "purchase_order_items",
    "column_name": "purchase_order_id",
    "foreign_table_name": "purchase_orders",
    "foreign_column_name": "id"
  },
  {
    "table_name": "purchase_order_items",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "admin_notes",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "credit_accounts",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "credit_accounts",
    "column_name": "approved_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "credit_transactions",
    "column_name": "credit_account_id",
    "foreign_table_name": "credit_accounts",
    "foreign_column_name": "id"
  },
  {
    "table_name": "credit_transactions",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "invoices",
    "column_name": "order_id",
    "foreign_table_name": "orders",
    "foreign_column_name": "id"
  },
  {
    "table_name": "invoices",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "invoices",
    "column_name": "voided_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "expenses",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "shipments",
    "column_name": "order_id",
    "foreign_table_name": "orders",
    "foreign_column_name": "id"
  },
  {
    "table_name": "shipments",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "notification_log",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "payable_payments",
    "column_name": "purchase_order_id",
    "foreign_table_name": "purchase_orders",
    "foreign_column_name": "id"
  },
  {
    "table_name": "payable_payments",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "push_tokens",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "orders",
    "column_name": "credit_transaction_id",
    "foreign_table_name": "credit_transactions",
    "foreign_column_name": "id"
  },
  {
    "table_name": "warehouse_transfers",
    "column_name": "from_warehouse_id",
    "foreign_table_name": "warehouses",
    "foreign_column_name": "id"
  },
  {
    "table_name": "warehouse_transfers",
    "column_name": "to_warehouse_id",
    "foreign_table_name": "warehouses",
    "foreign_column_name": "id"
  },
  {
    "table_name": "warehouse_transfers",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "warehouse_transfers",
    "column_name": "received_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "warehouse_transfer_items",
    "column_name": "transfer_id",
    "foreign_table_name": "warehouse_transfers",
    "foreign_column_name": "id"
  },
  {
    "table_name": "warehouse_transfer_items",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "service_tickets",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "service_tickets",
    "column_name": "assigned_to",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "ticket_parts",
    "column_name": "ticket_id",
    "foreign_table_name": "service_tickets",
    "foreign_column_name": "id"
  },
  {
    "table_name": "ticket_status_history",
    "column_name": "ticket_id",
    "foreign_table_name": "service_tickets",
    "foreign_column_name": "id"
  },
  {
    "table_name": "ticket_status_history",
    "column_name": "changed_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "loyalty_accounts",
    "column_name": "customer_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "loyalty_transactions",
    "column_name": "loyalty_account_id",
    "foreign_table_name": "loyalty_accounts",
    "foreign_column_name": "id"
  },
  {
    "table_name": "loyalty_transactions",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "appliance_models",
    "column_name": "brand_id",
    "foreign_table_name": "brands",
    "foreign_column_name": "id"
  },
  {
    "table_name": "product_compatibility",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "product_compatibility",
    "column_name": "appliance_model_id",
    "foreign_table_name": "appliance_models",
    "foreign_column_name": "id"
  },
  {
    "table_name": "audit_log",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "system_config",
    "column_name": "updated_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_count_sessions",
    "column_name": "warehouse_id",
    "foreign_table_name": "warehouses",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_count_sessions",
    "column_name": "started_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_count_sessions",
    "column_name": "completed_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_count_items",
    "column_name": "count_session_id",
    "foreign_table_name": "inventory_count_sessions",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_count_items",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "inventory_count_items",
    "column_name": "counted_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "part_equivalences",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "orders",
    "column_name": "warehouse_id",
    "foreign_table_name": "warehouses",
    "foreign_column_name": "id"
  },
  {
    "table_name": "product_image_embeddings",
    "column_name": "product_id",
    "foreign_table_name": "products",
    "foreign_column_name": "id"
  },
  {
    "table_name": "product_image_embeddings",
    "column_name": "product_image_id",
    "foreign_table_name": "product_images",
    "foreign_column_name": "id"
  }
]