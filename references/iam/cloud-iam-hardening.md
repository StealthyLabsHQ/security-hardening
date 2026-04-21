---
title: "Cloud & IAM Hardening"
slug: cloud-iam-hardening
category: iam
depth: 2
audit_level: [3, 4]
last_reviewed: 2026-04-21
sources:
  - "AWS IAM best practices — https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"
  - "Google Cloud IAM best practices — https://cloud.google.com/iam/docs/using-iam-securely"
  - "Azure identity security documentation — https://learn.microsoft.com/entra/identity/"
  - "NIST SP 800-162 (ABAC) — https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-162.pdf"
triggers_strong: ["aws iam", "gcp iam", "azure security", "metadata service"]
triggers_weak: ["cloud hardening", "identity review"]
related: ["active-directory-hardening", "container-k8s-hardening"]
---

# Cloud & IAM Hardening

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Recommended | Audit Level: 3-4 | Automation: Partial (Trivy, Checkov, AWS Config; IAM reviews manual)

Covers AWS, GCP, and Azure. Focus on IAM least privilege, storage exposure, metadata service abuse, and secrets management.

---

## Core Principle: Least Privilege

Every principal (user, service account, role, Lambda, pod) should have only the permissions it needs to do its specific job - nothing more.

**Common violations:**
- Service accounts with `roles/owner` or `AdministratorAccess`
- Lambda functions with `s3:*` when they only need `s3:GetObject` on one bucket
- CI/CD runners with production write access
- Developers with permanent admin access instead of just-in-time elevation

---

## AWS

### IAM

```json
// Vulnerable - wildcard on all resources
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

// Safe - scoped to specific actions and resource
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-app-uploads/*"
}
```

**Audit commands:**

```bash
# Find policies with wildcard actions on all resources
aws iam list-policies --scope Local --query 'Policies[*].Arn' --output text | \
  xargs -I{} aws iam get-policy-version \
    --policy-arn {} \
    --version-id $(aws iam get-policy --policy-arn {} --query 'Policy.DefaultVersionId' --output text) \
  | jq '.PolicyVersion.Document.Statement[] | select(.Effect=="Allow" and .Action=="*" and .Resource=="*")'

# Find users with no MFA
aws iam get-credential-report
aws iam generate-credential-report

# Find access keys older than 90 days
aws iam list-users --query 'Users[*].UserName' --output text | \
  xargs -I{} aws iam list-access-keys --user-name {} \
  | jq '.AccessKeyMetadata[] | select(.CreateDate < (now - 7776000 | todate))'
```

**IAM hardening checklist:**
- [ ] Root account has no access keys (delete them)
- [ ] Root account has MFA enabled
- [ ] All IAM users have MFA enabled
- [ ] No access keys older than 90 days
- [ ] No inline policies with `*:*` on `*`
- [ ] Service roles scoped to specific resources and actions
- [ ] Use IAM roles for EC2/Lambda/ECS - never hardcode access keys

### S3 - Preventing Public Exposure

```bash
# Block all public access at account level (do this first)
aws s3control put-public-access-block \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Check for public buckets
aws s3api list-buckets --query 'Buckets[*].Name' --output text | \
  xargs -I{} aws s3api get-bucket-policy-status --bucket {} 2>/dev/null \
  | jq 'select(.PolicyStatus.IsPublic == true)'

# Enable server-side encryption on all buckets
aws s3api put-bucket-encryption --bucket my-bucket \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

**S3 checklist:**
- [ ] Block Public Access enabled at account and bucket level
- [ ] No bucket ACLs set to `public-read` or `public-read-write`
- [ ] Server-side encryption enabled on all buckets
- [ ] Bucket logging enabled for sensitive buckets
- [ ] Lifecycle policies to delete old data

### AWS Secrets Manager

```python
import boto3

def get_secret(secret_name: str) -> str:
    client = boto3.client("secretsmanager", region_name="us-east-1")
    return client.get_secret_value(SecretId=secret_name)["SecretString"]

# Usage - never hardcode
DB_PASSWORD = get_secret("myapp/prod/db-password")
OPENAI_KEY  = get_secret("myapp/prod/openai-key")
```

### EC2 Metadata Service (IMDS) - SSRF Protection

The metadata service at `169.254.169.254` exposes IAM credentials. Require IMDSv2 (token-based) to prevent SSRF-based credential theft.

```bash
# Require IMDSv2 on existing instances
aws ec2 modify-instance-metadata-options \
  --instance-id i-1234567890abcdef0 \
  --http-tokens required \
  --http-endpoint enabled

# Require IMDSv2 at account level for new instances
aws ec2 enable-image-block-public-access --image-block-public-access-state block-new-sharing
```

### CloudTrail - Audit Logging

```bash
# Enable CloudTrail in all regions
aws cloudtrail create-trail \
  --name org-trail \
  --s3-bucket-name my-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation

# Alert on root account usage
aws cloudwatch put-metric-alarm \
  --alarm-name RootAccountUsage \
  --metric-name RootAccountUsage \
  --namespace CloudTrailMetrics \
  --statistic Sum --period 300 --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:us-east-1:123456789:security-alerts
```

---

## GCP

### Service Account Hardening

```bash
# List service accounts with owner/editor roles (should be empty or minimal)
gcloud projects get-iam-policy PROJECT_ID \
  --format=json | jq '.bindings[] | select(.role == "roles/owner" or .role == "roles/editor")'

# Create a minimal service account for an app
gcloud iam service-accounts create my-app-sa \
  --display-name "My App Service Account"

# Grant only what is needed
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:my-app-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"  # not roles/storage.admin
```

**GCP checklist:**
- [ ] No service account has `roles/owner` or `roles/editor`
- [ ] Service account keys rotated or replaced with Workload Identity
- [ ] Default service accounts not used for production workloads
- [ ] Org policies: disable service account key creation where possible

### GCS Bucket Exposure

```bash
# Check for publicly accessible buckets
gsutil iam get gs://my-bucket | grep allUsers

# Remove public access
gsutil iam ch -d allUsers:objectViewer gs://my-bucket

# Enable uniform bucket-level access (disables ACLs)
gsutil uniformbucketlevelaccess set on gs://my-bucket
```

### GCP Secret Manager

```python
from google.cloud import secretmanager

def get_secret(project_id: str, secret_name: str) -> str:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    return client.access_secret_version(request={"name": name}).payload.data.decode("UTF-8")
```

---

## Azure

### RBAC

```bash
# List over-privileged assignments (Owner/Contributor at subscription level)
az role assignment list --all --query \
  "[?roleDefinitionName=='Owner' || roleDefinitionName=='Contributor'] | [?scope=='/subscriptions/SUBSCRIPTION_ID']"

# Use Privileged Identity Management (PIM) for eligible assignments
# Users must activate their privileged role for a limited time window
```

### Key Vault

```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://my-vault.vault.azure.net", credential=credential)
secret = client.get_secret("my-secret").value
```

**Azure checklist:**
- [ ] No permanent Owner/Contributor assignments - use PIM eligible roles
- [ ] All privileged roles require MFA on activation
- [ ] Storage accounts: disable public blob access at account level
- [ ] Key Vault: soft delete and purge protection enabled
- [ ] Diagnostic logs enabled for Key Vault, Storage, and VMs

---

## CI/CD IAM - Least Privilege for Runners

A CI/CD runner with excessive permissions is a critical attack surface - any malicious PR or compromised pipeline step can abuse them.

### GitHub Actions - OIDC (no long-lived keys)

```yaml
# Use OIDC to get short-lived AWS credentials - no stored access keys needed
jobs:
  deploy:
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy
          aws-region: us-east-1
          # role has only s3:sync on the specific bucket, nothing else
```

### GitHub Actions - Minimal Permissions

```yaml
# Deny all by default, grant only what the job needs
permissions: {}   # denies all

jobs:
  security-scan:
    permissions:
      contents: read      # read repo
      security-events: write  # write SARIF results
      # nothing else
```

---

## Infrastructure as Code Security

```bash
# Checkov - scan Terraform/CloudFormation/Kubernetes for misconfigs
pip install checkov
checkov -d . --framework terraform

# tfsec - focused on Terraform
brew install tfsec
tfsec .

# Common findings to fix:
# - S3 bucket without encryption
# - Security group with 0.0.0.0/0 inbound on port 22 or 3389
# - RDS instance publicly accessible
# - Lambda with overly permissive role
# - CloudTrail logging disabled
```

---

## Audit Checklist

| Check | AWS | GCP | Azure |
|-------|-----|-----|-------|
| Root/superadmin has no persistent access keys | IAM | SA keys disabled | PIM eligible only |
| MFA on all privileged accounts | IAM MFA | 2-Step Verification | Conditional Access |
| No wildcard permissions on production resources | IAM policies | IAM roles | RBAC |
| Public storage access blocked by default | S3 Block Public Access | Uniform bucket access | Disable anonymous blob |
| Secrets in managed vault, not in env vars | Secrets Manager | Secret Manager | Key Vault |
| Metadata service requires token (IMDSv2 / equivalent) | IMDSv2 required | Metadata-Flavor header | Instance Metadata Service |
| Audit logging enabled | CloudTrail | Cloud Audit Logs | Azure Monitor / Defender |
| IaC scanned for misconfigs in CI | Checkov / tfsec | Checkov | Checkov |

