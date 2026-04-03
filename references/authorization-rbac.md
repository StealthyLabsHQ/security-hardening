# Authorization: RBAC, ABAC, ReBAC & IDOR Prevention

> Last reviewed: 2026-04-03 | Next review: 2027-04-03 | Priority: Essential | Automation: Partial (SAST catches some patterns; ownership checks manual)


Authentication answers "who are you?". Authorization answers "what are you allowed to do?". Most breaches exploit authorization failures, not authentication.

---

## Models

### RBAC - Role-Based Access Control

Users are assigned roles; roles grant permissions.

```
User --> Role --> Permissions
alice --> admin --> [read, write, delete]
bob   --> viewer --> [read]
```

**Best for:** Applications with a small, stable set of roles (admin, editor, viewer).

**Weakness:** Role explosion - when you create many fine-grained roles, RBAC becomes unmanageable. Does not handle "a user can only edit their own documents" natively.

```python
# RBAC implementation (FastAPI)
def require_role(*roles):
    def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403)
        return current_user
    return dependency

@app.delete('/posts/{post_id}')
def delete_post(post_id: int, user=Depends(require_role('admin', 'moderator'))):
    ...
```

---

### ABAC - Attribute-Based Access Control

Access is determined by evaluating policies against attributes of the user, the resource, and the environment.

```
Policy: ALLOW if user.department == resource.department AND user.clearance >= resource.classification
```

**Best for:** Complex enterprise applications with dynamic, context-sensitive access rules (time of day, IP, user attributes).

**Weakness:** More complex to implement and reason about. Policy engine required (OPA, Casbin).

```python
# OPA (Open Policy Agent) evaluation
import requests

def check_opa(user, action, resource):
    response = requests.post('http://opa:8181/v1/data/myapp/authz/allow', json={
        'input': {'user': user, 'action': action, 'resource': resource}
    })
    return response.json().get('result', False)

@app.put('/documents/{doc_id}')
def update_doc(doc_id: int, current_user=Depends(get_current_user)):
    doc = get_doc(doc_id)
    if not check_opa(current_user, 'write', doc):
        raise HTTPException(status_code=403)
    ...
```

---

### ReBAC - Relationship-Based Access Control

Access is determined by the relationship graph between users and resources.

```
alice --[owner]--> document:42
bob   --[viewer]--> document:42
```

**Best for:** Applications like Google Docs, GitHub, Notion where sharing is arbitrary and granular.

**Tools:** Google Zanzibar (open implementations: OpenFGA, SpiceDB, Permify).

---

## Deny-by-Default Pattern

Never assume access is allowed. Start from denial and explicitly grant.

```python
# Vulnerable - access granted unless explicitly denied
def can_access(user, resource):
    if resource.visibility == 'private' and resource.owner != user:
        return False
    return True  # grants access to everything not explicitly blocked

# Safe - deny-by-default
def can_access(user, resource):
    if resource.visibility == 'public':
        return True
    if resource.owner_id == user.id:
        return True
    if resource.id in get_shared_resources(user.id):
        return True
    return False  # deny by default
```

---

## IDOR / BOLA Prevention

IDOR (Insecure Direct Object Reference) = BOLA (Broken Object Level Authorization). The most reported API vulnerability.

**Attack:**
```
GET /api/reports/1001 → user's own report (HTTP 200)
GET /api/reports/1002 → another user's report (should be 403, but returns 200)
```

**Anti-patterns:**

```python
# Vulnerable - only checks authentication, not ownership
def get_report(report_id: int, current_user=Depends(get_current_user)):
    return db.query(Report).filter(Report.id == report_id).first()

# Vulnerable - IDOR via predictable sequential ID
report_url = f"/api/reports/{report.id}"  # id=1001, 1002, 1003...
```

**Safe patterns:**

```python
# Always join on owner
def get_report(report_id: int, current_user=Depends(get_current_user)):
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.owner_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404)  # 404, not 403 - don't reveal existence
    return report
```

```python
# Use UUIDs to prevent enumeration (defense in depth)
import uuid
class Report(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

**Rule:** Return 404 (not 403) when the resource does not exist *or* the user is not authorized. A 403 reveals that the resource exists.

---

## Common Authorization Anti-Patterns

### Frontend-Only Check

```javascript
// Vulnerable - only the UI hides the button; API has no check
if (user.isAdmin) {
  document.getElementById('deleteBtn').style.display = 'block';
}
// API endpoint /api/admin/delete has no server-side auth check
```

### Role Passed by the Client

```javascript
// Vulnerable - client sends their own role
fetch('/api/action', {
  method: 'POST',
  body: JSON.stringify({ role: 'admin', action: 'delete' })
});
```

**Fix:** Never trust role/permission claims from the client. Always read the role from the server-side session or validated JWT.

### Checking Authentication But Not Authorization

```python
# Vulnerable - only checks "is logged in", not "can do this"
@login_required
def admin_dashboard():
    return render_template('admin.html')  # any logged-in user can access
```

---

## Authorization Checklist

| Check | Expected |
|-------|----------|
| Deny-by-default applied to all resources | Yes |
| Ownership checked on every object-level operation | Yes |
| Role/permissions read server-side (not from client payload) | Yes |
| Admin/privileged endpoints have explicit role checks | Yes |
| 404 returned when resource not found OR not authorized | Yes |
| UUIDs or equivalent used instead of sequential IDs | Yes |
| Frontend visibility checks are backed by server-side enforcement | Yes |
| New routes added to the authorization policy (not just coded) | Yes |

**Tools**

| Tool | Purpose |
|------|---------|
| Open Policy Agent (OPA) | Policy engine for ABAC |
| Casbin | RBAC/ABAC/ACL library (Go, Node, Python, Java) |
| OpenFGA | Google Zanzibar-inspired ReBAC |
| py-RBAC / casl | Lightweight RBAC for Python / JavaScript |
