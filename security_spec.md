# Firebase Security Specification - JDAutoPilot

## Data Invariants
- A Lead must have a valid email.
- A Lead must have a source.
- `createdAt` must be a server timestamp.
- Leads can only be created, not read, updated, or deleted by the public.

## The Dirty Dozen Payloads
1. **Email Spoofing**: Attempt to create a lead with an invalid email format.
2. **Shadow Field Injection**: Attempt to create a lead with an `isAdmin: true` field.
3. **Future Timestamp**: Attempt to set `createdAt` to a future date instead of `request.time`.
4. **Identity Theft**: Attempt to update an existing lead's email.
5. **Data Scraping**: Attempt to list all leads from the client.
6. **Orphaned Lead**: Attempt to create a lead without a source.
7. **Resource Poisoning**: Attempt to use a 2MB string as an email.
8. **Malicious ID**: Attempt to create a lead with a path-traversal ID.
9. ** unauthorized Delete**: Attempt to clear the leads collection.
10. **State Corruption**: Attempt to change the source of a lead after creation.
11. **PII Leak**: Attempt to 'get' a specific lead document by ID without auth.
12. **Recursive Write**: Attempt to batch write 500 leads at once to exhaust quota.

## Security Controls
- Use `isValidLead()` helper for all writes.
- `allow create: if true` (Public leads capture).
- `allow read, update, delete: if false` (No one can read/modify leads from the client).
