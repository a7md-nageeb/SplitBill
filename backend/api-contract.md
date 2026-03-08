## SplitBill Backend API Sketch (Phase 2+)

This document sketches the core HTTP API for a future Node.js/TypeScript backend that syncs bills, powers guest web links, and later supports InstaPay deep-link generation. Shapes are aligned with the mobile app domain models in `mobile/src/domain`.

### Authentication

- **Phase 2**: Simple token-based auth (e.g. `Authorization: Bearer <token>`).
- **User identity**: Minimal `userId` with name + email/phone; no wallet or funds custody.

---

### Common Types (JSON Shapes)

#### Bill

```json
{
  "id": "bill_123",
  "ownerUserId": "user_abc",
  "title": "Zamalek dinner",
  "createdAt": "2026-03-01T20:10:00.000Z",
  "currency": "EGP",
  "subtotal": 350.0,
  "serviceRate": 0.12,
  "vatRate": 0.14,
  "serviceAmount": 42.0,
  "vatAmount": 54.88,
  "total": 446.88,
  "notes": "Table 7"
}
```

#### Participant

```json
{
  "id": "p1",
  "billId": "bill_123",
  "displayName": "You",
  "contact": "+2012…",
  "isPayer": true
}
```

#### Item

```json
{
  "id": "item_1",
  "billId": "bill_123",
  "label": "Koshari",
  "price": 100.0,
  "isShared": false,
  "createdAt": "2026-03-01T20:10:00.000Z"
}
```

#### ItemShare

```json
{
  "id": "share_1",
  "itemId": "item_1",
  "participantId": "p1",
  "shareType": "EQUAL",
  "weight": 1
}
```

#### ParticipantShareSummary

```json
{
  "participantId": "p1",
  "itemSubtotal": 130.0,
  "serviceShare": 15.6,
  "vatShare": 20.44,
  "grandTotal": 166.04
}
```

---

## 1. Bills CRUD & Sync

### POST /v1/bills

Create or upsert a bill calculated on-device.

**Request body**

```json
{
  "bill": { /* Bill */ },
  "participants": [ /* Participant[] */ ],
  "items": [ /* Item[] */ ],
  "itemShares": [ /* ItemShare[] */ ],
  "participantSummaries": [ /* ParticipantShareSummary[] */ ],
  "clientMetadata": {
    "platform": "ios",
    "appVersion": "1.0.0",
    "locale": "ar-EG"
  }
}
```

**Response 201**

```json
{
  "billId": "bill_123",
  "ownerUserId": "user_abc"
}
```

Notes:

- Backend **does not recompute** math in early phases; it trusts the client and may verify later.

---

### GET /v1/bills/:billId

Fetch a full bill with all its related entities.

**Response 200**

```json
{
  "bill": { /* Bill */ },
  "participants": [ /* Participant[] */ ],
  "items": [ /* Item[] */ ],
  "itemShares": [ /* ItemShare[] */ ],
  "participantSummaries": [ /* ParticipantShareSummary[] */ ]
}
```

---

### GET /v1/bills

List bills for the authenticated user (for multi-device sync).

Query params:

- `limit` (optional, default 50)
- `cursor` (optional, for pagination)

**Response 200**

```json
{
  "bills": [
    {
      "bill": { /* Bill */ },
      "participants": [ /* Participant[] */ ]
    }
  ],
  "nextCursor": "opaque_cursor_or_null"
}
```

---

## 2. Guest Web & Share Links

### POST /v1/guest-sessions

Create a short-lived guest session that powers the mobile-web guest flow.

**Request body**

```json
{
  "billId": "bill_123",
  "expiresInSeconds": 3600
}
```

**Response 201**

```json
{
  "guestSessionId": "gs_456",
  "shareUrl": "https://app.splitbill.eg/g/gs_456"
}
```

---

### GET /v1/guest-sessions/:guestSessionId

Fetch a read-only view of bill data for the guest UI.

**Response 200**

```json
{
  "bill": { /* Bill */ },
  "participants": [ /* Participant[] */ ],
  "items": [ /* Item[] */ ],
  "itemShares": [ /* ItemShare[] */ ]
}
```

Guests can then pick items and submit which ones they consumed; the mobile app remains the source of truth.

---

## 3. InstaPay Deep-Link Helper (Later Phase)

The backend does **not** move money; it only helps construct payment instructions and deep-link payloads.

### POST /v1/bills/:billId/payment-links

Generate suggested transfer payloads per participant for InstaPay (and other rails later).

**Request body**

```json
{
  "instapayAddress": "user@bank",
  "includePayer": false
}
```

**Response 200**

```json
{
  "billId": "bill_123",
  "links": [
    {
      "participantId": "p2",
      "amount": 166.04,
      "instapayUri": "instapay://transfer?amount=166.04&ipa=user@bank&note=SplitBill%20bill_123%20p2",
      "note": "SplitBill Zamalek dinner · p2"
    }
  ]
}
```

The exact `instapayUri` format will be updated once official documentation is available; until then, the app can use `note` and `amount` to prefill bank app transfers manually.

---

## 4. OCR Hook (Future)

The OCR provider will typically be called directly from the backend to avoid exposing API keys in the app.

### POST /v1/ocr/receipts

Upload a receipt image (or URL) and receive a normalized draft bill.

**Request body**

```json
{
  "imageUrl": "https://…",
  "locale": "ar-EG"
}
```

**Response 202**

```json
{
  "draftBill": {
    "bill": { /* Bill with rough subtotal/service/vat */ },
    "items": [ /* extracted Item[] */ ]
  }
}
```

Client keeps manual editing as the final source of truth before saving the bill.

