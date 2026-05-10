import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { buildReceivablesSchedule } from "../domain/receivables.js";

function computeStatus(baseStatus, dueDate, today) {
  if (baseStatus === "paid") {
    return "paid";
  }
  return dueDate < today ? "overdue" : "pending";
}

export class RentalRepository {
  constructor(databasePath = ":memory:") {
    if (databasePath !== ":memory:") {
      fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    }
    this.db = new Database(databasePath);
    this.db.pragma("journal_mode = WAL");
    this.initialize();
  }

  initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        document TEXT,
        phone TEXT,
        email TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        document TEXT,
        phone TEXT,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        monthly_rent REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_id) REFERENCES owners(id)
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL,
        tenant_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'rental',
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        due_day INTEGER NOT NULL,
        rent_amount REAL NOT NULL,
        deposit_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(property_id) REFERENCES properties(id),
        FOREIGN KEY(owner_id) REFERENCES owners(id),
        FOREIGN KEY(tenant_id) REFERENCES tenants(id)
      );

      CREATE TABLE IF NOT EXISTS receivables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER NOT NULL,
        reference_month TEXT NOT NULL,
        due_date TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        received_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(contract_id) REFERENCES contracts(id)
      );
    `);
  }

  listOwners() {
    return this.db.prepare(`SELECT * FROM owners ORDER BY name`).all();
  }

  createOwner(input) {
    const statement = this.db.prepare(`
      INSERT INTO owners (name, document, phone, email, notes)
      VALUES (@name, @document, @phone, @email, @notes)
    `);
    const result = statement.run({
      name: input.name,
      document: input.document ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null
    });
    return this.db.prepare(`SELECT * FROM owners WHERE id = ?`).get(result.lastInsertRowid);
  }

  listTenants() {
    return this.db.prepare(`SELECT * FROM tenants ORDER BY name`).all();
  }

  createTenant(input) {
    const statement = this.db.prepare(`
      INSERT INTO tenants (name, document, phone, email, status)
      VALUES (@name, @document, @phone, @email, @status)
    `);
    const result = statement.run({
      name: input.name,
      document: input.document ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      status: input.status ?? "active"
    });
    return this.db.prepare(`SELECT * FROM tenants WHERE id = ?`).get(result.lastInsertRowid);
  }

  listProperties() {
    return this.db
      .prepare(`
        SELECT properties.*, owners.name AS owner_name
        FROM properties
        INNER JOIN owners ON owners.id = properties.owner_id
        ORDER BY properties.code
      `)
      .all();
  }

  createProperty(input) {
    const statement = this.db.prepare(`
      INSERT INTO properties (owner_id, code, title, address, city, state, monthly_rent, status)
      VALUES (@owner_id, @code, @title, @address, @city, @state, @monthly_rent, @status)
    `);
    const result = statement.run({
      owner_id: Number(input.owner_id),
      code: input.code,
      title: input.title,
      address: input.address,
      city: input.city,
      state: input.state,
      monthly_rent: Number(input.monthly_rent),
      status: input.status ?? "available"
    });
    return this.db.prepare(`SELECT * FROM properties WHERE id = ?`).get(result.lastInsertRowid);
  }

  listContracts() {
    return this.db
      .prepare(`
        SELECT contracts.*,
               owners.name AS owner_name,
               tenants.name AS tenant_name,
               properties.code AS property_code,
               properties.title AS property_title
        FROM contracts
        INNER JOIN owners ON owners.id = contracts.owner_id
        INNER JOIN tenants ON tenants.id = contracts.tenant_id
        INNER JOIN properties ON properties.id = contracts.property_id
        ORDER BY contracts.start_date DESC
      `)
      .all();
  }

  createContract(input) {
    const property = this.db.prepare(`SELECT * FROM properties WHERE id = ?`).get(Number(input.property_id));
    if (!property) {
      throw new Error("Imovel nao encontrado");
    }

    const createContract = this.db.transaction(() => {
      const result = this.db
        .prepare(`
          INSERT INTO contracts (
            property_id, owner_id, tenant_id, type, start_date, end_date, due_day, rent_amount, deposit_amount, status
          ) VALUES (
            @property_id, @owner_id, @tenant_id, @type, @start_date, @end_date, @due_day, @rent_amount, @deposit_amount, @status
          )
        `)
        .run({
          property_id: Number(input.property_id),
          owner_id: Number(property.owner_id),
          tenant_id: Number(input.tenant_id),
          type: input.type ?? "rental",
          start_date: input.start_date,
          end_date: input.end_date,
          due_day: Number(input.due_day),
          rent_amount: Number(input.rent_amount),
          deposit_amount: Number(input.deposit_amount ?? 0),
          status: input.status ?? "active"
        });

      const contractId = Number(result.lastInsertRowid);
      const receivables = buildReceivablesSchedule({
        start_date: input.start_date,
        end_date: input.end_date,
        due_day: Number(input.due_day),
        rent_amount: Number(input.rent_amount)
      });

      const insertReceivable = this.db.prepare(`
        INSERT INTO receivables (contract_id, reference_month, due_date, amount, status)
        VALUES (@contract_id, @reference_month, @due_date, @amount, @status)
      `);

      for (const receivable of receivables) {
        insertReceivable.run({
          contract_id: contractId,
          reference_month: receivable.reference_month,
          due_date: receivable.due_date,
          amount: receivable.amount,
          status: receivable.status
        });
      }

      this.db
        .prepare(`UPDATE properties SET status = 'rented' WHERE id = ?`)
        .run(Number(input.property_id));

      return this.db.prepare(`SELECT * FROM contracts WHERE id = ?`).get(contractId);
    });

    return createContract();
  }

  listReceivables(today = new Date().toISOString().slice(0, 10)) {
    return this.db
      .prepare(`
        SELECT receivables.*,
               contracts.rent_amount,
               owners.name AS owner_name,
               tenants.name AS tenant_name,
               properties.code AS property_code,
               properties.title AS property_title
        FROM receivables
        INNER JOIN contracts ON contracts.id = receivables.contract_id
        INNER JOIN owners ON owners.id = contracts.owner_id
        INNER JOIN tenants ON tenants.id = contracts.tenant_id
        INNER JOIN properties ON properties.id = contracts.property_id
        ORDER BY receivables.due_date ASC
      `)
      .all()
      .map((row) => ({
        ...row,
        status_label: computeStatus(row.status, row.due_date, today)
      }));
  }

  recordPayment(id, payload = {}) {
    const result = this.db
      .prepare(`
        UPDATE receivables
        SET status = 'paid',
            received_at = @received_at,
            notes = COALESCE(@notes, notes)
        WHERE id = @id
      `)
      .run({
        id: Number(id),
        received_at: payload.received_at ?? new Date().toISOString().slice(0, 10),
        notes: payload.notes ?? null
      });

    if (!result.changes) {
      throw new Error("Conta a receber nao encontrada");
    }

    return this.db.prepare(`SELECT * FROM receivables WHERE id = ?`).get(Number(id));
  }

  getSummary(today = new Date().toISOString().slice(0, 10)) {
    const totals = this.db
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM owners) AS owners,
          (SELECT COUNT(*) FROM tenants) AS tenants,
          (SELECT COUNT(*) FROM properties) AS properties,
          (SELECT COUNT(*) FROM contracts WHERE status = 'active') AS active_contracts,
          (SELECT COALESCE(SUM(amount), 0) FROM receivables) AS expected_total,
          (SELECT COALESCE(SUM(amount), 0) FROM receivables WHERE status = 'paid') AS received_total
      `)
      .get();

    const overdue = this.db
      .prepare(`
        SELECT COUNT(*) AS overdue_count, COALESCE(SUM(amount), 0) AS overdue_total
        FROM receivables
        WHERE status != 'paid' AND due_date < ?
      `)
      .get(today);

    return {
      ...totals,
      overdue_count: overdue.overdue_count,
      overdue_total: overdue.overdue_total
    };
  }

  getOwnerPerformance(today = new Date().toISOString().slice(0, 10)) {
    return this.db
      .prepare(`
        SELECT
          owners.id,
          owners.name,
          COUNT(DISTINCT properties.id) AS properties_count,
          COALESCE(SUM(receivables.amount), 0) AS expected_total,
          COALESCE(SUM(CASE WHEN receivables.status = 'paid' THEN receivables.amount ELSE 0 END), 0) AS received_total,
          COALESCE(SUM(CASE WHEN receivables.status != 'paid' AND receivables.due_date < ? THEN receivables.amount ELSE 0 END), 0) AS overdue_total
        FROM owners
        LEFT JOIN properties ON properties.owner_id = owners.id
        LEFT JOIN contracts ON contracts.owner_id = owners.id
        LEFT JOIN receivables ON receivables.contract_id = contracts.id
        GROUP BY owners.id, owners.name
        ORDER BY owners.name
      `)
      .all(today);
  }

  seedDemoData() {
    const alreadySeeded = this.db.prepare(`SELECT COUNT(*) AS total FROM owners`).get();
    if (alreadySeeded.total > 0) {
      return this.snapshot();
    }

    const owner = this.createOwner({
      name: "Mariana Costa",
      document: "123.456.789-00",
      phone: "(11) 99888-2211",
      email: "mariana@imobiliaria.local"
    });

    const tenant = this.createTenant({
      name: "Carlos Menezes",
      document: "987.654.321-00",
      phone: "(11) 97777-5544",
      email: "carlos@cliente.local"
    });

    const property = this.createProperty({
      owner_id: owner.id,
      code: "APT-101",
      title: "Apartamento Centro",
      address: "Rua das Palmeiras, 101",
      city: "Sao Paulo",
      state: "SP",
      monthly_rent: 3200
    });

    this.createContract({
      property_id: property.id,
      tenant_id: tenant.id,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      due_day: 5,
      rent_amount: 3200,
      deposit_amount: 3200
    });

    const firstReceivable = this.db.prepare(`SELECT id FROM receivables ORDER BY id LIMIT 1`).get();
    this.recordPayment(firstReceivable.id, { received_at: "2026-01-05", notes: "Recebido via pix" });

    return this.snapshot();
  }

  snapshot(today = new Date().toISOString().slice(0, 10)) {
    return {
      owners: this.listOwners(),
      tenants: this.listTenants(),
      properties: this.listProperties(),
      contracts: this.listContracts(),
      receivables: this.listReceivables(today),
      summary: this.getSummary(today),
      ownerPerformance: this.getOwnerPerformance(today)
    };
  }
}
