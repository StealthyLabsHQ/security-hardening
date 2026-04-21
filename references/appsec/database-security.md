---
title: "Database Security"
slug: database-security
category: appsec
depth: 2
audit_level: [2, 3]
last_reviewed: 2026-04-21
sources:
  - "OWASP SQL Injection Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
  - "PostgreSQL documentation — https://www.postgresql.org/docs/"
  - "SQLAlchemy documentation — https://docs.sqlalchemy.org"
  - "PCI DSS 4.0.1 — https://docs-prv.pcisecuritystandards.org (2024-06, requires keyed cryptographic hashes for PAN)"
triggers_strong: ["sql injection", "parameterized queries", "row-level security", "database security"]
triggers_weak: ["db review", "storage security"]
related: ["api-security", "language-patterns"]
---

# Database Security

> Last reviewed: 2026-04-14 | Next review: 2026-10-14 | Priority: High | Audit Level: 2-3 | Automation: Partial

Database tier hardening - because most "I got hacked" stories start with the DB. Covers parameterized queries by ORM, least-privilege accounts, Postgres Row-Level Security, encryption at rest, backup security, and audit logging.

---

## 1. Parameterized queries (CWE-89)

Never concatenate user input into SQL. Always bind parameters.

### Node.js (pg)

```js
// BAD
await client.query(`SELECT * FROM users WHERE email = '${email}'`);

// GOOD
await client.query('SELECT * FROM users WHERE email = $1', [email]);
```

### Python (psycopg / SQLAlchemy)

```python
# BAD
cur.execute(f"SELECT * FROM users WHERE email = '{email}'")

# GOOD - psycopg
cur.execute("SELECT * FROM users WHERE email = %s", (email,))

# GOOD - SQLAlchemy Core
stmt = select(users).where(users.c.email == email)

# GOOD - SQLAlchemy ORM
session.query(User).filter(User.email == email).first()
```

### Go (database/sql)

```go
// BAD
db.Query("SELECT * FROM users WHERE email = '" + email + "'")

// GOOD
db.Query("SELECT * FROM users WHERE email = $1", email)
```

### Java (JDBC / JPA)

```java
// BAD
stmt.executeQuery("SELECT * FROM users WHERE email = '" + email + "'");

// GOOD - PreparedStatement
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
ps.setString(1, email);

// GOOD - JPA
em.createQuery("SELECT u FROM User u WHERE u.email = :email")
  .setParameter("email", email);
```

### Watch out for ORM escape hatches

These accept raw SQL and bypass parameterization:

| ORM | Dangerous method | Safe alternative |
|-----|------------------|------------------|
| Sequelize | `sequelize.query(raw)` | `sequelize.query(sql, { replacements })` |
| TypeORM | `query()` with template string | Query Builder with parameters |
| Django | `cursor.execute(f"...")` | `cursor.execute(sql, params)` |
| SQLAlchemy | `text(f"...")` | `text("...").bindparams()` |
| Prisma | `$queryRawUnsafe` | `$queryRaw` (tagged template) |
| Hibernate | `createNativeQuery(concat)` | `setParameter` |

---

## 2. Least-privilege application accounts

Your app should never connect as `root`, `postgres`, `sa`, or any superuser. Create a dedicated role per service with the minimum grants required.

### Postgres example

```sql
-- Create role
CREATE ROLE app_orders LOGIN PASSWORD 'use-a-vault-not-this';

-- Limit what it can see
REVOKE ALL ON SCHEMA public FROM app_orders;
GRANT USAGE ON SCHEMA orders TO app_orders;

-- Per-table grants (no DDL, no DROP)
GRANT SELECT, INSERT, UPDATE ON orders.orders TO app_orders;
GRANT SELECT ON orders.products TO app_orders;

-- No access to other schemas
REVOKE ALL ON SCHEMA accounting FROM app_orders;

-- Strip default privileges so future tables stay locked down
ALTER DEFAULT PRIVILEGES IN SCHEMA orders REVOKE ALL ON TABLES FROM PUBLIC;
```

### Anti-patterns

| Anti-pattern | Why it is bad | Fix |
|--------------|---------------|-----|
| Single `app` role for every microservice | One SQLi compromises everything | One role per service |
| App role owns the schema | Allows DROP TABLE via SQLi | Migrations user owns; app user only DML |
| `GRANT ALL ON DATABASE` | Includes `CREATE`, `TEMP`, etc. | Grant per-table only |
| `SUPERUSER`, `BYPASSRLS` | Bypasses RLS, can read pg_authid | Never on app accounts |
| Using DB credentials in `.env` files committed to git | Secret leak | Use a secrets manager (Vault, AWS SM, Doppler) |

---

## 3. Postgres Row-Level Security (RLS)

RLS pushes IDOR/BOLA prevention down to the database. Even if your app code forgets a `WHERE tenant_id = ?`, the DB enforces it.

```sql
-- Enable RLS on the table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY; -- applies to table owner too

-- Policy: users can only see their tenant's rows
CREATE POLICY tenant_isolation ON invoices
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Set the session variable on connection checkout (do this in middleware)
-- Node.js example:
-- await client.query("SET LOCAL app.tenant_id = $1", [req.user.tenantId]);
```

### Gotchas

- `BYPASSRLS` role attribute disables RLS. Audit with:
  ```sql
  SELECT rolname FROM pg_roles WHERE rolbypassrls;
  ```
- Use `SET LOCAL` (transaction-scoped) not `SET` (session-scoped) so connection pooling does not leak tenants.
- `FORCE ROW LEVEL SECURITY` is required if the app role owns the table.
- Test policies with `SET ROLE app_orders;` before deploying.

---

## 4. Encryption at rest

| Layer | What it protects against | Tooling |
|-------|--------------------------|---------|
| Disk-level (LUKS, EBS encryption, GCS CMEK) | Stolen disk, decommissioned hardware | Cloud-managed keys, KMS |
| Tablespace / TDE | DBA reading raw files | Postgres `pgcrypto`, SQL Server TDE, Oracle TDE |
| Column-level (application-managed) | DBA, backups, replicas | Envelope encryption with AWS KMS / GCP KMS / Vault Transit |
| Searchable encryption | Need to query encrypted fields | Deterministic IV (weaker) or order-revealing encryption (research-grade) |

### When to use column-level

- PII (SSN, national ID, passport)
- Payment credentials beyond what your PCI scope mandates
- Health records (HIPAA PHI)
- Anything whose breach triggers GDPR Article 33 notification

Application-side AES-256-GCM with a KMS-managed data key is the default. See `applied-cryptography.md` for code examples.

---

## 5. Backup security

Backups are the most often-forgotten copy of production data.

Checklist:

- [ ] Backups are encrypted at rest with a key the DBAs cannot read alone (KMS + IAM separation of duty).
- [ ] Off-site / cross-region copy (3-2-1 rule).
- [ ] Restore drills at least quarterly. If you have not restored from backup in 90 days, you do not have backups.
- [ ] Backup bucket / volume is private. Audit with:
  ```bash
  aws s3api get-bucket-acl --bucket my-db-backups
  aws s3api get-public-access-block --bucket my-db-backups
  ```
- [ ] PITR (point-in-time recovery) enabled for ransomware / accidental DROP scenarios.
- [ ] Backup retention matches the data retention policy (do not keep deleted user data forever in backups - see `privacy-data-minimization.md`).
- [ ] Anonymize / scrub PII when refreshing non-prod environments from prod backups.

---

## 6. Audit logging

You cannot detect a breach you cannot see.

### Postgres

```ini
# postgresql.conf
log_connections = on
log_disconnections = on
log_statement = 'ddl'           # log all DDL (use 'mod' or 'all' for high-value DBs)
log_min_duration_statement = 1000  # slow query log
log_line_prefix = '%m [%p] user=%u,db=%d,app=%a,client=%h '
```

For row-level audit, use the `pgaudit` extension (`pgaudit.log = 'write, ddl'`).

### What to capture

- Every successful and failed login (with source IP, user, app name).
- Every DDL change (`CREATE`, `ALTER`, `DROP`, `GRANT`).
- Every `DELETE` and `UPDATE` against PII tables.
- Every privilege escalation (`SET ROLE`, `SUDO`).

### Where to send the logs

- Centralized SIEM (Splunk, Elastic, Datadog, Loki).
- Cloud-native: CloudWatch Logs / Cloud Logging / Azure Monitor.
- Immutable storage with retention >= 1 year (compliance dependent).

---

## 7. Network exposure

- DB listens on `127.0.0.1` or a private subnet only - never on `0.0.0.0` with a public IP.
- Cloud DBs (RDS, Cloud SQL, Azure SQL) have **public access disabled**.
- Security group / firewall allows only the application subnet.
- Audit:
  ```bash
  # AWS RDS
  aws rds describe-db-instances \
    --query 'DBInstances[?PubliclyAccessible==`true`].[DBInstanceIdentifier]'

  # GCP Cloud SQL
  gcloud sql instances list --filter='settings.ipConfiguration.ipv4Enabled=true'
  ```
- Force TLS for all client connections (`rds.force_ssl = 1` for Postgres on RDS).

---

## 8. Detection cheat sheet

| Signal | Likely cause |
|--------|--------------|
| Unusual `EXPLAIN` patterns / `UNION SELECT` in slow log | Active SQLi attempt |
| Login from a new geography for an app role | Credential theft |
| `DROP TABLE` outside a migration window | Compromise or insider |
| Sudden surge in `pg_stat_statements` rows for one query | Enumeration / scraping |
| Connection from outside the app subnet | Lateral movement |
| `pg_authid` SELECT by app role | Escalation in progress |

---

## 9. Tools

- **sqlmap** - test your endpoints in a staging environment.
- **pgaudit** - row-level Postgres audit logging.
- **CloudSploit / Prowler / ScoutSuite** - cloud DB misconfiguration scans.
- **Trivy / Checkov** - IaC scanning for `publicly_accessible = true` and similar.
- **Vault Database Secrets Engine** - dynamic short-lived DB credentials per service.

---

## CWE references

- CWE-89: SQL Injection
- CWE-269: Improper Privilege Management
- CWE-311: Missing Encryption of Sensitive Data
- CWE-312: Cleartext Storage of Sensitive Information
- CWE-732: Incorrect Permission Assignment for Critical Resource
- CWE-798: Use of Hard-coded Credentials

