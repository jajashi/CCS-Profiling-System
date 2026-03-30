# Student record (mock / API contract)

Matches [`frontend/src/pages/StudentInformation.jsx`](../../frontend/src/pages/StudentInformation.jsx) inline mock data.

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique student identifier (e.g. `2026-001`). |
| `firstName` | string | Given name. |
| `middleName` | string | Middle initial or name. |
| `lastName` | string | Family name. |
| `gender` | string | e.g. `Male`, `Female`. |
| `dob` | string | Date of birth as ISO date string `YYYY-MM-DD`. |
| `program` | string | Program or course code (e.g. `BSCS`, `BSIT`). |
| `yearLevel` | string | Year level as displayed (e.g. `1`, `2`). |
| `section` | string | Section code (e.g. `CS2A`). |
| `status` | string | Enrollment status (e.g. `Enrolled`, `On Leave`, `Graduating`). |
| `scholarship` | string | Scholarship label or `None`. |
| `email` | string | School email. |
| `contact` | string | Phone / contact number. |
| `dateEnrolled` | string | Enrollment date as ISO date string `YYYY-MM-DD`. |
| `guardian` | string | Guardian full name. |
| `guardianContact` | string | Guardian phone / contact. |
| `violation` | string | Single-line violation summary (e.g. `None`, `Warning (late)`). |

**Note:** MongoDB stores an internal `_id`; API responses omit `_id` and `__v` so payloads align with this contract.