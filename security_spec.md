# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: No read or write is permitted to any path not explicitly matched.
2. **Verified Identity**: All writes require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Ownership & Relational Integrity**:
   - Every `/tickets/{ticketId}` document has an `ownerId` equal to `request.auth.uid` on creation, and `ownerId` + `createdAt` + `ticketId` are strictly immutable on update.
   - Every `/tickets/{ticketId}/history/{eventId}` subcollection document requires the parent `/tickets/{ticketId}` document to exist and belong to `request.auth.uid` (or an admin), and `actorUid` must equal `request.auth.uid`.
4. **Terminal State Locking**: Once a ticket's `status` reaches `'Closed'`, non-admin users cannot update the document.
5. **Temporal Integrity**: `createdAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on update.
6. **Query Enforcement**: `list` on `/tickets` is restricted to `resource.data.ownerId == request.auth.uid` (or `isAdmin()`), preventing unauthorized cross-tenant query scraping.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/tickets/DEO-2026-001` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth.uid = 'u1', email_verified = false`, creating `/tickets/DEO-2026-001` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: `auth.uid = 'u1'`, payload sets `ownerId: 'u2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Payload adds `isApprovedByMayor: true` not in `hasOnly()` -> `PERMISSION_DENIED`.
5. **Path ID Poisoning**: Document ID with invalid regex or >128 chars (`/tickets/bad$id!`) -> `PERMISSION_DENIED`.
6. **Denial-of-Wallet Oversized String**: `description` with 5,000 characters (> 1500 max) -> `PERMISSION_DENIED`.
7. **Invalid Enum Value**: `status: 'Officially Dispatched'` (not in allowed status enum) -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation on Update**: Changing `ownerId` or `createdAt` during update -> `PERMISSION_DENIED`.
9. **Terminal State Bypass**: Updating a ticket whose existing `status == 'Closed'` as a non-admin -> `PERMISSION_DENIED`.
10. **Forged Client Timestamp**: Setting `createdAt` to a past/future timestamp (`!= request.time`) -> `PERMISSION_DENIED`.
11. **Orphaned Subcollection Write**: Creating `/tickets/NON_EXISTENT/history/ev1` where parent ticket does not exist -> `PERMISSION_DENIED`.
12. **Blanket List Query Scraping**: Listing `/tickets` without filtering `ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
