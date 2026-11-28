# Deliverable 2 Evidence Index

All demonstrations in this directory were **executed** against a local instance of
the candidate (migrated PostgreSQL + Express API). The transcript in
`program-demonstrations.md` contains the actual HTTP status and response body for
each step; no UI-only claim and no synthetic "expected" output is presented as
actual.

## ID scheme

`EV-D2-<area>-<nn>` where area is:

| Prefix | Area | Covered IDs |
| :--- | :--- | :--- |
| `A` | Sprint 1 continuity / normal journey | EV-D2-A-01..05 |
| `B` | Business-rule and boundary rejection | EV-D2-B-01..03 |
| `C` | Forbidden access / no self-approval | EV-D2-C-01..04 |
| `F08` | Attachments lifecycle | EV-D2-F08-01..03 |
| `F09` | Sprint 3 filter progress | EV-D2-F09-01 |

Each entry records: role, preconditions, steps, expected result, actual HTTP
status and response, timestamp and tested candidate revision.

## Mapping to assessed cases

| Scenario | AC / requirement | Evidence |
| :--- | :--- | :--- |
| Create → retrieve → reviewer approve → requester sees result | AC-01, AC-03, AC-06, FR-05 | EV-D2-A-01..05 |
| Invalid amount / second decision / REJECT without comment | AC-02, AC-08, AC-12 | EV-D2-B-01..03 |
| No cookie / requester review / unrelated reviewer / self-approval | AC-04, AC-07, AC-09, AC-10, BR-01 | EV-D2-C-01..04 |
| Attachment upload, authorized and forbidden download | AC-16.1, AC-16.3, AC-16.5 | EV-D2-F08-01..03 |
| Filtered retrieval on candidate | AC-17.1, AC-17.5 | EV-D2-F09-01 |

## Notes
- Synthetic demo accounts only; no real password, token or secret appears in the transcripts.
- Binary file bytes are intentionally omitted from the attachment download transcript.
- UI screenshots, if added to the PDF, must be labelled with the corresponding `EV-D2-*` ID and must not replace the API-level evidence above.
