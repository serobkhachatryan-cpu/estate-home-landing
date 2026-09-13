# Oriel ontology proposals

These are proposed additions to the W3DS Ontology service, not application
configuration. They must be reviewed and published upstream before Oriel can
reference their `schemaId` values in an eVault write or a Web3 Adapter mapping.

## Why these two records exist

- `Property` represents a home, building, or land record and belongs to the
  owner’s eVault in the `property` domain.
- `PropertyExpense` represents an operating cost attached to that property. It
  also belongs to the owner’s eVault in the `property` domain, so a property
  platform can operate without turning an expense into an orphaned generic
  finance record.

The existing W3DS `Ledger` schema was reviewed before these were drafted. It
does not carry a property relationship, supplier, operating status, business
date, or minor-unit amount, so using it would discard Oriel’s essential
meaning.

## W3DS ownership plan

| Record | Authoritative location | Owner | Local role after approval |
| --- | --- | --- | --- |
| Property | Owner or group eVault | `ownerEname` | Read projection only |
| PropertyExpense | Owner or group eVault | `ownerEname` | Read projection only |
| Login offers and sessions | Oriel D1 | Oriel operational state | Expiring security state |

For both proposed records, the eVault write path will be a direct
`createMetaEnvelope` / `updateMetaEnvelope` call made after Oriel verifies the
user’s W3DS session. Every eVault call will resolve the owner’s eVault through
the Registry and send `X-ENAME: <ownerEname>`.

## Before implementation

1. Open an upstream ontology pull request containing these files under
   `services/ontology/schemas/` in `MetaState-Prototype-Project/prototype`.
2. Wait for the schemas to be published by the Ontology service.
3. Resolve the published schema IDs again from the live registry.
4. Port Oriel to GitW3 and obtain its platform identity before the production
   data integration.
5. Replace D1 property and spending records with eVault-sourced projections;
   existing local rows are then migrated only with their owner’s confirmed
   W3DS access.

Until step 2 is complete, these schemas are drafts. Oriel intentionally has no
runtime mapping or eVault write path that references them.
