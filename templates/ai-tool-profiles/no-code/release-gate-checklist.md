# No-Code / Low-Code Release Gate

Release is blocked until every applicable item below is checked or explicitly waived with owner approval.

## Identity and Ownership

- [ ] No production connector is owned by a personal account
- [ ] SSO and MFA are enabled for admins/editors
- [ ] Editor/admin roles were reviewed and least privilege applied

## Environments and Data

- [ ] Dev, staging, and prod use separate credentials or projects
- [ ] No raw production data was used in prompts, demos, or templates without approval
- [ ] Preview links and internal apps require authentication

## Integrations

- [ ] Connector scopes were reviewed and minimized
- [ ] Webhooks verify signature and timestamp where supported
- [ ] High-impact automations have an approval or dual-control step

## Secrets and Client Exposure

- [ ] Secrets are stored in the platform's protected secret store, not plain text fields
- [ ] No client-side bundle, preview, or browser inspector exposes sensitive keys

## Recovery and Audit

- [ ] Export / backup path was tested
- [ ] Audit logs are enabled and retained
- [ ] Rollback procedure is documented

## Human Review Areas

- [ ] Auth / RBAC logic was reviewed manually
- [ ] Payment, billing, deletion, or GDPR flows were reviewed manually
- [ ] Infra or permission-changing automations were reviewed manually
