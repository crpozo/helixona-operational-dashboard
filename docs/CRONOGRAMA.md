# Cronograma · Integración de datos reales — Helixona Operational Dashboard

**Objetivo:** conectar el dashboard (hoy 100% mock) a los datos reales de la operación:
**ECW (eClinicalWorks)** como fuente principal vía bot de extracción, más **8x8** (llamadas),
**billing/claims** y **marketing** (Instagram, Facebook, Web, Email).

**Fecha de elaboración:** 14 de julio de 2026
**Inicio propuesto:** lunes 20 de julio de 2026
**Duración realista:** **16 semanas** (go-live completo ≈ 6 de noviembre de 2026)
— optimista: 12 semanas · conservador: 20 semanas si eBO/licencias se atascan.

---

## 1. Resumen ejecutivo

| | |
|---|---|
| Primer dato real en el dashboard | **Semana 4–5** (mediados de agosto) |
| Llamadas 8x8 + marketing en vivo | **Semana 7–8** (inicios de septiembre) |
| Billing/claims completo | **Semana 12** (inicios de octubre) |
| Dashboard completo estabilizado | **Semana 16** (inicios de noviembre) |

El cronograma ya incluye buffers: **×1.5** sobre estimados de desarrollo propio y
**×2–3 en calendario** para todo lo que dependa de terceros (soporte de ECW, licencias,
aprobaciones de Meta). Esto no es pesimismo: el soporte de eClinicalWorks tiene CSAT ~3.3/5
y hay anécdotas documentadas de tickets abiertos por meses.

### Supuestos

- Equipo de **1–2 desarrolladores** dedicados.
- ECW en **cloud** (peor caso). Si resulta ser self-hosted/on-prem, hay acceso directo a la
  base MySQL y las fases 2, 3 y 6 se comprimen ~4 semanas (ver riesgo R1).
- El founder/operación dedica **2–4 h/semana** a decisiones (definiciones de métricas,
  targets, validación).
- Presupuesto disponible para: 1 seat 8x8 X4 si falta (~$), posible licencia eBO (cotizar
  en semana 1), y hosting cloud con BAA (HIPAA).

---

## 2. Qué depende de cada fuente

Del inventario métrica por métrica del dashboard:

| Fuente | % del dashboard | Qué aporta | Método de extracción | Riesgo |
|---|---|---|---|---|
| **ECW clínico/agenda** | ~40% | Pacientes, citas, no-shows, procedimientos (IVs, EBOOs…), ocupación, agenda | Reportes programados (CSV) + **bot Playwright** para pantallas no programables | Alto (UI legacy, MFA, cambios de versión) |
| **ECW Billing / claims** | ~25–30% | Charges, pagos, claims por payer, denials, A/R, cash vs insurance | Reportes estándar; **eBO** (Cognos) para detalle claims-level si se aprueba | Alto (gated por ECW/licencia) |
| **8x8** | ~5–8% | Llamadas entrantes/salientes/perdidas por agente, duración | **API oficial** (Analytics for Work, `/extsum` + `/cdr`) | Bajo–medio (requiere 1 seat X4+) |
| **Marketing** | ~10% | Followers, engagement, sesiones web, campañas email | **APIs oficiales**: Meta Graph (app interna), GA4, Mailchimp | Bajo |
| **Manual / sin sistema** | ~20% | **Leads/CRM (no existe sistema de registro)**, targets, stars/misses, upsells, lockbox, capacidades, rosters | Formularios de captura + tablas de configuración | Alto (descubrimiento + cambio de hábitos) |

> ⚠️ **El hallazgo más importante:** el funnel de pacientes, el pipeline de nuevos pacientes
> y toda la vista Patient Journey dependen de datos de **leads que hoy no viven en ningún
> sistema identificado** (ni ECW ni 8x8 los tienen). Definir dónde se capturan los leads es
> tan crítico como el bot de ECW.

---

## 3. Cronograma por fases

```
Semana:            1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
F0 Descubrimiento  ██ ██
F1 Infraestructura    ██ ██
F2 ECW v1 reportes       ██ ██ ██
F3 Bot RPA ECW                 ██ ██ ██ ██ ██
F4 8x8                         ██ ██ ██
F5 Marketing                      ██ ██ ██
F6 Billing prof./eBO                    ▒▒ ██ ██ ██ ██      (▒ = espera de ECW)
F7 CRM + capturas                    ██ ██ ██ ██ ██
F8 Integración dash                           ██ ██ ██ ██
F9 Validación+estab.                                   ██ ██ ██ ██
Hitos:                        M1       M2          M3       M4
```

### Fase 0 — Descubrimiento y accesos (semanas 1–2 · 20–31 jul)

La fase que responde "no sabemos dónde está todo". Todo lo de esta fase es barato y
desbloquea el resto; nada de código de producción todavía.

**Preguntas que hay que responder (checklist semana 1):**
1. ¿ECW es cloud o self-hosted? *(el fork más importante de todo el proyecto)*
2. Pedir al account manager de ECW: cotización de **eBO** y si venden **acceso read-only a
   la BD** (~$200/mes/provider — se sabe que lo ofrecen; hay que preguntar).
3. ¿Qué reportes de ECW se pueden **programar** (envío automático CSV por email) en nuestra
   licencia? Listar: citas/agenda, claims/AR, pagos, CPT/procedimientos, registry.
4. ¿Hay algún usuario 8x8 con licencia **X4+** y acceso "Analytics for 8x8 Work"? Si no,
   comprar 1 seat para cuenta de servicio (+1–2 semanas de procurement).
5. ¿Dónde viven los **leads** hoy? (¿spreadsheet? ¿cuaderno? ¿nada?) ¿Quién captura waitlist,
   declines y motivos?
6. ¿Las ventas **cash** (wellness) pasan por ECW billing o por otro POS?
7. ¿ECW tiene configurado **scheduling por sala/recurso**? (sin esto no hay ocupación real)
8. Definiciones con el founder: "revenue today" (¿facturado o cobrado?), "wait for next
   appt" (¿lead time de booking o próximo slot libre?), "missed call" (ring groups
   sobre-cuentan), reglas de **atribución de revenue por empleado**.

**Accesos a crear:**
- Usuario de servicio ECW "reporting" con mínimos privilegios + TOTP dedicado.
- API key 8x8 (Admin Console → Analytics for 8x8 Work) + usuario de servicio.
- App Meta **interna en Development Mode** sobre el Business Manager propio (evita App
  Review: 1–2 semanas en vez de 4–8) + iniciar Business Verification ya.
- Service account GA4 (Viewer en la property) y API key Mailchimp.
- Registrar app **Bulk FHIR** de ECW (gratis, en background — enriquecimiento clínico futuro).

**Entregable:** documento de decisiones + matriz métrica→fuente→método confirmada.

### Fase 1 — Infraestructura base (semanas 2–4 · 27 jul–14 ago)

- Host único (VM cloud con **BAA** firmado o servidor propio) con Docker Compose:
  Postgres (landing `jsonb` + tablas mart), scheduler (cron/pg-boss — Temporal/Airflow son
  overkill), worker Playwright, y salida al dashboard (JSON estático regenerado por corrida
  o mini-API read-only) **detrás de autenticación**.
- Secretos con SOPS o secrets manager (nunca `.env` plano en git).
- **Monitoreo desde el día 1:** dead-man's-switch por job (Healthchecks.io), tripwires de
  calidad (row-count vs promedio, not-null en campos clave — el selector drift produce
  *valores vacíos silenciosos*, no crashes) y badge de frescura por fuente en el dashboard.
- Hardening HIPAA: AES-256 at rest, TLS 1.2+, MFA/RBAC, audit logs. El dashboard solo debe
  ver agregados; filas con PHI se quedan en la landing zone (excepto Patient Journey, que
  requiere control de acceso propio).

**Entregable:** pipeline esqueleto corriendo con un job dummy monitorizado.

### Fase 2 — ECW v1: reportes programados + parser (semanas 3–6 · 3 ago–4 sep)

El camino pragmático: ECW programa reportes recurrentes → mailbox/SFTP dedicado → parser
(IMAP + CSV → Postgres, cargas idempotentes). Cubre: citas y agenda, claims/AR, pagos,
volúmenes CPT, demografía. **Cero dependencia del soporte de ECW.**

- **🏁 HITO M1 (fin semana 4–inicio 5):** primeros datos reales de ECW en Overview/Today.
- Backfill histórico: solicitar **EHI population export** a ECW (una sola vez, para sembrar
  históricos y deltas) — pedirlo en semana 3 porque es request-based y tarda.
- Aceleración opcional: descarga manual semanal de CSVs por el staff desde la semana 2
  mientras el parser madura.

### Fase 3 — Bot RPA sobre ECW (semanas 5–9 · 17 ago–2 oct)

Para los reportes/pantallas que **no** se pueden programar en nuestra licencia. Es un camino
comercialmente probado (el propio blog de ECW promueve bots RPA) pero es la pieza más frágil:

- Playwright: login + TOTP (pyotp) en ráfagas cortas login→export→logout (los timeouts de
  sesión de ECW son cortos); UI legacy JSP con iframes — selectores por label/ARIA, nunca
  IDs generados.
- Preferir **botones de descarga CSV nativos** (Registry, Report Console, reportes de
  claims) sobre leer tablas en pantalla.
- Artefactos de browser (screenshots, traces, HAR) **desactivados o depurados**: capturan PHI.
- 2 semanas de las 5 son endurecimiento y contratiempos esperados (MFA edge cases,
  arqueología de iframes, formatos de reporte sorpresa). Verificar además con quien tenga el
  contrato de ECW que no haya cláusula contra acceso automatizado.

### Fase 4 — 8x8 (semanas 5–7 · 17 ago–4 sep, en paralelo)

- API oficial **Analytics for 8x8 Work**: `GET /extsum` da exactamente lo que necesitan
  Team/Employees (Inbound_Answered, Inbound_Missed, Outbound_Total por extensión) en una
  llamada por ventana; `/cdr` para drill-down. Token de 30 min → refresh en el ETL.
- Mapeo extensión 8x8 ↔ empleado del roster (tabla de identidad, fase 7).
- Interim de riesgo cero: reporte CSV diario programado desde 8x8 a un mailbox.
- Retención de 8x8: **2 años** — el backfill llega hasta ahí.

### Fase 5 — Marketing (semanas 6–8 · 24 ago–11 sep, en paralelo)

- Meta Graph API con **System User token** (no expira; los tokens de usuario mueren a los
  60 días o con cambios de password — alertar en error 190 y en frescura).
- GA4 Data API (service account) y Mailchimp Reports API: ~1 semana entre ambos.
- **El snapshot diario de followers arranca el primer día posible** — Meta no permite
  backfill histórico de followers; cada día sin snapshot es un dato perdido para siempre.
- "Leads por canal" requiere UTMs fluyendo hacia la captura de leads (depende de fase 7).

### Fase 6 — Billing profundo / eBO (semanas 7–12 · 31 ago–9 oct, gated por ECW)

- Si la cotización de eBO (pedida en semana 1) es razonable: reportes claims-level
  programados desde Cognos (allowable real, denials con códigos, A/R por payer). Lead time
  típico 4–10 semanas desde la firma — por eso se cotiza en semana 1 y se integra aquí.
- Si eBO no se aprueba: reportes estándar de billing + jobs RPA extra; la vista Insurance &
  Billing sale con menos detalle (sin allowable pre-remittance, denials por categoría
  aproximados con mapeo manual de códigos).
- **🏁 HITO M3 (semana 12):** Revenue + Insurance & Billing con datos reales.

### Fase 7 — CRM de leads + capturas manuales (semanas 6–10 · 24 ago–2 oct)

Lo que ningún bot puede scrapear porque **no existe el sistema**:

- Decidir e implementar el registro de leads: CRM ligero o formulario estructurado →
  Postgres (stages con timestamps: Lead → Contacted → Onboarding → Patient → 1st appt,
  coordinator, source, decline reason). Esto alimenta el funnel, el pipeline y Patient Journey.
- Superficies de captura para: targets por rol/empleado y goals (con dueño asignado),
  tallies operativos (stars/misses, upsells, % dripping, EOD lockbox), roster de turnos.
- Tablas de configuración: capacidad por sala/unidad, mapeo código-servicio → modalidad
  (catálogo de 14 servicios), mapeo denial-code → categoría, **mapeo de identidades
  ECW user ↔ extensión 8x8 ↔ roster** (prerequisito de Team/Employees).
- Incluye **cambio de hábitos del staff** — 2 semanas de adopción asistida.

### Fase 8 — Integración con el dashboard (semanas 9–13 · 14 sep–16 oct)

- Reemplazar los `get*` de `src/data/mockData.ts` por la API real **vista por vista** (el
  contrato de tipos de `src/types.ts` ya está pensado para esto).
- Los filtros pasan de multiplicadores fake a queries reales: rango de fechas particionado,
  cash/insurance real en cada registro.
- Deltas vs periodo anterior calculados desde snapshots/histórico (infra propia, ninguna
  fuente lo da nativo).
- **🏁 HITO M2 ya cumplido en semana 7–8** (8x8 + marketing en vivo vía este mismo camino).

### Fase 9 — Corrida en paralelo, validación y estabilización (semanas 13–16 · 12 oct–6 nov)

- 2 semanas de corrida en paralelo: founder y office manager comparan dashboard vs realidad
  conocida (revenue del día, citas, llamadas) y se corrigen definiciones.
- Runbooks: qué hacer cuando un scraper se rompe, rotación de credenciales, re-auth MFA.
- Alertas afinadas (menos ruido, cero silencios).
- **🏁 HITO M4 (semana 16):** go-live completo. Buffer final de 1 semana incluido.

---

## 4. Riesgos principales y planes B

| # | Riesgo | Prob. | Impacto | Mitigación / Plan B |
|---|---|---|---|---|
| R1 | ECW resulta **self-hosted** (¡riesgo positivo!) | Media | −4 sem | SQL directo a MySQL; fases 2/3/6 se comprimen |
| R2 | Reportes clave de ECW **no programables** en nuestra licencia | Media | +1–2 sem | Más pantallas al bot RPA (fase 3 ya lo contempla) |
| R3 | **eBO caro o lento** (cotización > semanas) | Alta | Detalle billing limitado | Reportes estándar + RPA; escalar a eBO después del go-live |
| R4 | Update de versión de ECW **rompe el bot** | Alta (recurrente) | 1–2 días por evento | Selectores robustos, tripwires de datos vacíos, screenshot-on-failure sin PHI |
| R5 | No hay seat 8x8 **X4+** | Media | +1–2 sem | Comprar seat en semana 1 (por eso se pregunta primero) |
| R6 | Meta exige **App Review** pese a app interna | Baja–media | +4 sem solo marketing | El resto del proyecto no se bloquea; interim con export manual |
| R7 | El staff **no adopta** la captura de leads/tallies | Media–alta | Funnel/Journey sin datos | Formularios de <30 seg, revisión semanal con founder, champion interno |
| R8 | MFA/política de sesión de ECW cambia | Media | +2–5 días | Cuenta de servicio dedicada, TOTP re-enrolable, humano-en-el-loop documentado |
| R9 | Subestimación general (falacia de planificación) | — | — | Ya aplicado: ×1.5 dev propio, ×2–3 calendario en terceros; buffer explícito en F3, F9 |

## 5. Después del go-live: mantenimiento

Esto no termina en la semana 16. Presupuesto permanente:

- **2–5 h/semana** de mantenimiento estable (la industria subestima esto 4–6×).
- Picos de **1–2 días** cuando ECW cambia de versión o Meta depreca métricas (hay una ola
  de deprecación de Meta programada y son recurrentes).
- Cada fuente que migre de scraping a API oficial (p. ej. eBO o FHIR ganando cobertura)
  **reduce a la mitad** su parte del mantenimiento.

## 6. Decisiones que necesita tomar el founder (bloqueantes)

1. **Semana 1:** presupuesto sí/no para seat 8x8 X4 y disposición a cotizar eBO.
2. **Semana 2:** definiciones de métricas (revenue today, wait, missed) y reglas de
   atribución de revenue por empleado.
3. **Semana 6:** dónde se capturan los leads (CRM ligero vs formulario propio) y quién es
   el dueño de targets/goals.
4. **Semana 13:** sign-off de validación en paralelo antes del go-live.
