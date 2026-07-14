# Cronograma · Integración de datos reales — Helixona Operational Dashboard

**Objetivo:** conectar el dashboard (hoy 100% mock) a los datos reales de la operación:
**ECW (eClinicalWorks)** como fuente principal vía bot de extracción, más **8x8** (llamadas),
**billing/claims** y **marketing** (Instagram, Facebook, Web, Email).

**Fecha de elaboración:** 14 de julio de 2026
**Inicio propuesto:** lunes 20 de julio de 2026

| Escenario | Go-live | Condiciones |
|---|---|---|
| Optimista | 16 semanas (≈ 6 nov) | 2 devs, cero ausencias, decisiones del founder en 48 h, cero break-fix |
| **Realista (el plan)** | **18 semanas (≈ 20 nov)** | 2 devs, con presupuesto de ausencias, review/QA y roturas de pipes en vivo |
| Conservador | 20–22 semanas (≈ dic) | Si se atascan licencias/accesos o falla la adopción del staff |
| Con 1 solo dev | 24–26 semanas | Los carriles paralelos se vuelven secuenciales; no hay versión de 16–18 semanas con 1 dev |

Tras el go-live hay **maduración hasta la semana ~22**: funnel, seguros y tallies manuales
terminan de estabilizarse con historia suficiente (las etiquetas "provisional" se caen solas).

---

## 1. Resumen ejecutivo

| Hito | Cuándo | Qué incluye |
|---|---|---|
| **M1 · Primer dato real** | Semana 5 (≈ 21 ago) | Today + Overview con datos de ECW en el dashboard privado, por *cualquier* ruta de ingesta (la descarga manual de CSVs cuenta) |
| **M2 · Llamadas y marketing** | Semana 8–9 (mediados de sep) | 8x8 por API + Meta/GA4/Mailchimp en vivo |
| **M3 · Billing v1** | Semana 13 (mediados de oct) | Revenue, pagos, A/R y denials aproximados con reportes estándar. El detalle claims-level (allowable, códigos de denial) depende de eBO y llega **post-go-live** |
| **M4 · Go-live completo** | Semana 18 (≈ 20 nov) | Todas las vistas con datos reales; funnel/tallies y métricas de seguros <45 días marcadas **"provisional"** |

El cronograma aplica buffers **sin excepciones**: ×1.5 sobre estimados de desarrollo propio
y ×2–3 en calendario para todo lo que dependa de terceros (soporte de ECW, licencias,
aprobaciones) — por eso **nada gated por ECW está en la ruta crítica de un hito** (ni eBO,
ni el EHI export, ni el scheduling de reportes). No es pesimismo: el soporte de
eClinicalWorks tiene CSAT ~3.3/5 y hay anécdotas documentadas de tickets abiertos por meses.

**La ruta crítica real no es el bot.** El bot RPA es trabajo controlado por nosotros y con
buffer. Las dos cadenas que de verdad mueven el go-live son: (a) la cadena de compras eBO
(por eso quedó FUERA del alcance del go-live), y (b) **decisión de captura de leads → build
→ adopción del staff → validación** — por eso la decisión es en la semana 2, el formulario
vive en la semana 3–4, y la adopción termina ~semana 10 dejando holgura real antes de validar.

### Supuestos y aritmética de capacidad

- **2 desarrolladores con carriles nombrados** (la suma de fases es ~38 semanas-fase en 18
  semanas de calendario ≈ 2+ FTE: solo cierra si nadie está en dos carriles a la vez):
  - **Dev A — carril ECW:** F2 ingesta (S3–6) → F3 bot RPA **dedicado** (S5–10) → F6
    billing dev-heavy (S10–13).
  - **Dev B — carril plataforma:** F1 infra+hosting (S2–4) → F8 esqueleto de servido +
    Today/Overview (S4–5) → F4 8x8 (S5–7) → F5 marketing (S7–8, **serializado tras F4**,
    es el mismo tipo de trabajo) → F8 resto de vistas (S8–14).
  - **F7 captura manual:** office manager como dueña operativa + horas sueltas de dev.
- **Capacidad oculta, presupuestada y no negada:** ausencias/enfermedad en 4 meses que
  cruzan agosto y Labor Day (~1–1.5 semanas por dev es la norma estadística), 10–15% de
  overhead de code review/QA/deploys, y **break-fix de pipes ya vivos mientras se sigue
  construyendo** (R4 es "alta, recurrente": cada rotura de ECW cuesta 1–2 días que compiten
  con el build). Eso son ~2–3 semanas que el escenario de 16 se come en silencio — y es
  exactamente la diferencia entre 16 y 18.
- ECW en **cloud** (peor caso). Si resulta self-hosted/on-prem hay acceso directo a MySQL
  y las fases 2, 3 y 6 se comprimen ~4 semanas (riesgo positivo R1).
- **Horas del lado clínica, comprometidas de antemano** (no solo el founder):
  founder 2–4 h/sem para decisiones; **office manager 3–5 h/sem** en F0, F7 y F9 como
  contraparte operativa; **biller** 2 h en F0 (mapeo de denial codes y cash vs insurance)
  y 2–4 h en el cierre de mes de octubre (F9); front desk ~10 min/día para la descarga de
  CSVs mientras no haya automatización.
- Presupuesto para: 1 seat 8x8 X4 si falta, posible licencia eBO (cotizar semana 1),
  hosting cloud con BAA, y Google Workspace/M365 para el mailbox de reportes.
- **Regla de decisiones:** cada decisión del founder tiene fecha y un default escrito;
  si no se decide en fecha, aplica el default y el plan no se detiene.

---

## 2. Qué depende de cada fuente

Del inventario métrica por métrica del dashboard:

| Fuente | % del dashboard | Qué aporta | Método de extracción | Riesgo |
|---|---|---|---|---|
| **ECW clínico/agenda** | ~40% | Pacientes, citas, no-shows, procedimientos (IVs, EBOOs…), ocupación, agenda | CSVs (manual → programado si la licencia lo permite → **bot Playwright**) | Alto (UI legacy, MFA, cambios de versión) |
| **ECW Billing / claims** | ~25–30% | Charges, pagos, claims por payer, denials, A/R, cash vs insurance | Reportes estándar; **eBO** (Cognos) como upgrade post-go-live | Alto (gated por ECW/licencia) |
| **8x8** | ~5–8% | Llamadas entrantes/salientes/perdidas por agente, duración | **API oficial** (Analytics for Work, `/extsum` + `/cdr`) | Bajo–medio (requiere 1 seat X4+) |
| **Marketing** | ~10% | Followers, engagement, sesiones web, campañas email | **APIs oficiales**: Meta Graph (app interna), GA4, Mailchimp | Bajo |
| **Manual / sin sistema** | ~20% | **Leads/CRM (no existe sistema de registro)**, targets, stars/misses, upsells, lockbox, capacidades, rosters | Formularios de captura + tablas de configuración | Alto (descubrimiento + cambio de hábitos) |

> ⚠️ **Los dos datos que no se pueden recuperar después:** (1) los **leads** — no viven en
> ningún sistema, así que cada semana sin captura es historia del funnel perdida para
> siempre; (2) los **followers** de Meta — la API no permite backfill. Por eso ambos
> arrancan en las semanas 2–3, no cuando "les toque" su fase.

---

## 3. Cronograma por fases

```
Semana:              1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18
F0 Descubrimiento    ██ ██
F1 Infra + hosting      ██ ██ ██                                   Dev B
F2 ECW v1 ingesta          ██ ██ ██ ██                             Dev A
F3 Bot RPA ECW                   ██ ██ ██ ██ ██ ██                 Dev A
F4 8x8                           ██ ██ ██                          Dev B
F5 Marketing                           ██ ██                       Dev B
F6 Billing v1                             ██ ██ ██ ██ ██ ██        biller→Dev A
F7 Captura manual          ██ ██ ██ ██ ██ ██ ██ ██                 office mgr
F8 Integración dash           ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██     Dev B
F9 Validación                                            ██ ██ ██ ██
Buffer nombrado                                                       ██
                                 ▲M1          ▲M2             ▲M3       ▲M4
```

El buffer final (S18) tiene nombre: ausencias, break-fix acumulado y decisiones tardías.
Si no se consume, el go-live adelanta a la semana 16–17.

### Fase 0 — Descubrimiento, accesos y cumplimiento (semanas 1–2 · 20–31 jul)

La fase que responde "no sabemos dónde está todo". Todo es barato y desbloquea el resto.

**⛔ Tarea del día 1 (gate duro, bloquea M1):** el repo hoy **auto-publica cada push a un
GitHub Pages público**. Antes de que exista un solo dato real: neutralizar
`deploy.yml` (borrarlo o encadenarlo a una rama `demo` que solo pueda construir mock), y
dejar por escrito que **ningún dato real entra a una rama que publique a Pages**. Un push
descuidado con PHI a un sitio público es un incidente reportable, no un bug.

**Checklist de descubrimiento (semana 1) — con evidencia, no con promesas:**
1. ¿ECW es cloud o self-hosted? *(el fork más importante del proyecto)*
2. ¿**Quién tiene derechos de admin** en ECW? Si nadie los tiene, abrir ticket con ECW
   **hoy** (su cola se mide en semanas). Crear el usuario de servicio "reporting" con TOTP
   y **verificar a mano que puede abrir cada reporte objetivo** (los de billing suelen
   estar gated por security class).
3. ¿Se pueden **programar** reportes recurrentes (CSV por email) en nuestra licencia?
   **Verificarlo programando uno de verdad** — screenshot como entregable. La evidencia
   pública sugiere que en muchos tiers esto es función de eBO; por eso el plan NO depende
   de que la respuesta sea sí.
4. Pedir al account manager de ECW: cotización de **eBO**, y si venden **acceso read-only
   a la BD** (~$200/mes/provider — se sabe que lo han ofrecido; hay que preguntar).
5. Solicitar el **EHI population export** (gratis) — pero tratarlo como enriquecimiento
   post-go-live: con el historial de ECW en este tema, esperarlo en meses, no semanas.
6. ¿Hay usuario 8x8 con licencia **X4+** y "Analytics for 8x8 Work"? ¿**Quién puede entrar
   al Admin Console** (a veces lo administra un reseller/MSP)? Si falta el seat, comprarlo
   ya (+1–2 semanas de procurement). Sin X4 **no hay ningún camino de datos 8x8**, ni
   siquiera el interim de CSVs.
7. ¿Qué **Business Manager** es dueño de las cuentas de Instagram/Facebook (¿una agencia?)
   y tenemos admin? Iniciar **Business Verification** de Meta ya.
8. ¿Dónde viven los **leads** hoy? ¿Quién captura waitlist, declines y motivos?
9. ¿Las ventas **cash** pasan por ECW billing o por un POS aparte (Square/Stripe)?
   Si hay POS: integración API ~1 semana o planilla de conciliación EOD (2 días), dentro de F6.
10. ¿ECW tiene **scheduling por sala/recurso**? (sin esto no hay ocupación real)
11. ¿De dónde salen los **SMS** (¿8x8 o mensajería de ECW?), los **program tracks**
    (¿codificados en ECW o tag manual?) y los **slots libres** (¿algún reporte los exporta,
    o es objetivo RPA?)
12. Definiciones con el founder (sesión semana 2, con defaults escritos): "revenue today"
    (¿facturado o cobrado?), "wait for next appt", "missed call" (los ring groups
    sobre-cuentan), **cadencia de la vista Today** (¿corrida horaria del bot / 3 veces al
    día / diaria con badge "datos a las HH:MM"?), y reglas de **atribución de revenue por
    empleado** (aviso: es una decisión políticamente sensible — se re-litigará en F9 y hay
    slot formal para revisarla).

**Carril de cumplimiento (corre en paralelo, dueño: founder + office manager):**
- Si los devs son contractors: **BAA dev↔clínica firmado en semana 1**, antes de tocar el
  primer CSV con PHI (plantilla estándar, 1 día de trabajo — pero exige firma del founder).
- Inventario de todo vendor que tocará PHI (VM, mailbox, backups, error tracking) y estado
  de BAA de cada uno. El **mailbox de reportes debe ser Workspace/M365 del dominio de la
  clínica bajo BAA** — un Gmail personal no puede recibir CSVs con datos de pacientes — con
  purga automática a 30 días post-ingesta para que no se vuelva un archivo fantasma de PHI.
- Actualizar el **Security Risk Analysis** de la práctica (nuevo sistema, credencial de bot
  en el EHR, landing zone con PHI) con un **Security Officer designado** que firme — en una
  clínica de este tamaño probablemente el founder u office manager, que quizá no sabe que
  tiene ese rol. Incluye un tabletop de 30 min: "el CSV se fue al destinatario equivocado".

**Decisiones founder — semana 1:** presupuesto seat 8x8 · autorizar cotización eBO ·
firmar BAA dev · ok a neutralizar Pages.
**Decisiones founder — semana 2:** dónde se capturan los leads (default: formulario
estructurado propio) · definiciones de métricas · cadencia Today · defaults de atribución.

**Entregable:** documento de decisiones + matriz métrica→fuente→método confirmada.

### Fase 1 — Infraestructura y hosting privado (semanas 2–4 · 27 jul–14 ago · Dev B)

- Host único (VM cloud con **BAA** firmado) con Docker Compose: Postgres (landing `jsonb`
  + tablas mart), scheduler (cron/pg-boss — Temporal/Airflow son overkill), worker
  Playwright, y salida al dashboard.
- **El dashboard React se sirve desde este host, detrás de autenticación** (reverse proxy
  + TLS + SSO/basic-auth). Esto reemplaza a GitHub Pages y **es prerequisito de M1**: sin
  hosting privado no se cablea ni un dato real.
- Secretos con SOPS o secrets manager (nunca `.env` plano en git).
- **Monitoreo desde el día 1:** dead-man's-switch por job (Healthchecks.io), tripwires de
  calidad (row-count vs promedio, not-null, y total del footer del reporte vs filas
  parseadas — el selector drift y los row caps producen *datos vacíos o truncados
  silenciosos*, no crashes), badge de frescura por fuente en el dashboard. Las alertas
  llevan **solo status del job, nunca datos**.
- **Job genérico de snapshots diarios de métricas stock (semana 3)** — todo lo que es
  "foto del momento" y no se puede recalcular después: followers de Meta (primera
  registración — la app interna de F0 ya existe y cada día sin snapshot se pierde),
  A/R outstanding, waitlist, active-patients-90d. Cada fase registra sus métricas stock la
  semana en que su ingesta arranca; los deltas de F8 solo leen esta historia acumulada.
- **Tablas de configuración v0, sembradas desde las respuestas de F0** (semanas 2–3, son
  ~25 filas estáticas, no ingeniería): mapeo de identidades **ECW user ↔ extensión 8x8 ↔
  roster**, catálogo código-servicio → modalidad (14 servicios), capacidad por sala/unidad.
  Las superficies de edición llegan en F7; los datos existen desde ya. **Roster + mapeo v0
  son prerequisito de M1** (la tabla "team on shift" los necesita).
- Hardening HIPAA: AES-256 at rest, TLS 1.2+, MFA/RBAC, audit logs. El dashboard agregado
  solo ve conteos y tasas; las filas con PHI viven en la landing zone.

**Entregable:** dashboard servido en privado + pipeline esqueleto con un job monitorizado
+ snapshots corriendo + config v0 cargada.

### Fase 2 — ECW v1: ingesta de reportes (semanas 3–6 · 3–28 ago · Dev A)

**La ruta oficial de M1 es la humilde:** front desk descarga 4–5 CSVs (agenda/citas,
claims/AR, pagos, CPT, registry) a una carpeta compartida desde la semana 2 (~10 min/día).
El parser ingesta desde la carpeta **idéntico** sin importar si el CSV llegó por humano,
email programado, SFTP o bot — así M1 sobrevive a cualquier respuesta de ECW sobre
scheduling. Si la verificación de F0 confirmó reportes programables, se conectan y el
humano sale del loop; si no, el bot de F3 los reemplaza.

- Parsers **por reporte, no genéricos** (0.5–1 día c/u × 5): los exports de ECW traen
  bloques de título, totales al pie, layouts de Excel con celdas combinadas y formatos de
  fecha distintos por reporte. Detección de truncamiento en cada carga.
- Cargas idempotentes a Postgres; registro de A/R y demás métricas stock en el snapshot job.
- **Backfill histórico sin esperar a ECW:** los mismos reportes aceptan rangos de fecha —
  correrlos mes a mes hacia atrás 12 meses (2–3 días de trabajo, semanas 4–6). Esto llena
  las tendencias del Overview y los deltas. El EHI export, cuando llegue, solo enriquece.
- Implementar la **cadencia Today decidida en F0** (si es intradía, el export liviano de
  agenda/check-in corre cada 30–60 min en horario de clínica).

**🏁 HITO M1 (semana 5):** Today + Overview con datos reales de ECW en el dashboard
privado. Etiqueta honesta de frescura ("datos a las HH:MM"). Gráficos con historia parcial
lo dicen en pantalla ("histórico desde ago 2025 en construcción").

### Fase 3 — Bot RPA sobre ECW (semanas 5–10 · 17 ago–25 sep · Dev A dedicado)

Para reportes/pantallas no programables y para retirar al humano de la descarga diaria.
Camino comercialmente probado (el propio blog de ECW promueve bots RPA) pero la pieza más
frágil del proyecto. **6 semanas con Dev A sin otras cargas** — la investigación dice 3–6
semanas de dev ×1.5; comprimirlo solo sale bien en demos:

- Playwright: login + TOTP (pyotp) en ráfagas cortas login→export→logout (timeouts de
  sesión cortos). **ECW es single-session:** si un humano entra con la cuenta del bot, se
  matan mutuamente las sesiones y parece flakiness — "nadie usa la cuenta del bot" va en el
  runbook. IP de salida estable (pedir allowlist a ECW si se puede); cada click del bot
  queda en el audit trail de ECW a nombre del usuario de servicio — documentarlo en el SRA.
- UI legacy JSP con iframes: selectores por label/ARIA, nunca IDs generados. Preferir
  **botones de descarga CSV nativos** sobre leer tablas en pantalla.
- Artefactos de browser (screenshots, traces, HAR) **desactivados o depurados**: capturan PHI.
- 2 de las 6 semanas son endurecimiento y contratiempos esperados (MFA edge cases,
  arqueología de iframes, formatos sorpresa). Verificar con quien tenga el contrato de ECW
  que no haya cláusula contra acceso automatizado.

### Fase 4 — 8x8 (semanas 5–7 · 17 ago–4 sep · Dev B)

- API oficial **Analytics for 8x8 Work**: `GET /extsum` da exactamente lo que necesitan
  Team/Employees (Inbound_Answered, Inbound_Missed, Outbound_Total por extensión) en una
  llamada por ventana; `/cdr` para drill-down. Token de 30 min → refresh en el ETL.
- El mapeo extensión ↔ empleado ya existe (config v0 de F1).
- Interim de bajo esfuerzo si el API se demora: reporte CSV diario programado desde 8x8
  (**mismo prerequisito de licencia X4** — no existe camino sin el seat; y el schedule
  muere silenciosamente si se elimina el usuario que lo creó).
- Backfill: hasta 2 años **o desde que Analytics fue habilitado por extensión**, lo que
  sea más corto.

### Fase 5 — Marketing (semanas 7–8 · 31 ago–11 sep · Dev B, serializado tras F4)

- Meta Graph API con **System User token** (no expira; los tokens de usuario mueren a los
  60 días o con cambios de password — alertar en error 190 y en frescura). El snapshot de
  followers ya corre desde F1 — esta fase construye el conector completo.
- GA4 Data API (service account) y Mailchimp Reports API: ~1 semana entre ambos.
- **Tagging de eventos GA4 en el sitio web** (submits de booking/contacto como key events,
  UTMs consistentes): tarea propia — alimenta "conversions" y la atribución de leads de F7.
- "Leads por canal" requiere UTMs fluyendo hacia la captura de leads (F7).

**🏁 HITO M2 (semana 8–9):** 8x8 + marketing en vivo en Team/Employees y Marketing.

### Fase 6 — Billing v1 y eBO (semanas 8–13 · 7 sep–16 oct · biller primero, Dev A desde S10)

- Semanas 8–9 son de mapeo con el biller (denial codes → categorías, cash vs insurance,
  payer master) y configuración de reportes — carga dev baja mientras Dev A termina F3.
  Dev-heavy desde la semana 10.
- **Billing v1 = el default del plan:** reportes estándar + RPA. Revenue, pagos, mix
  cash/insurance, A/R, y denials aproximados con mapeo manual de códigos.
  Si hay POS aparte para cash, aquí aterriza su integración o la planilla EOD.
- **eBO es un upgrade, no una dependencia.** Matemática honesta: cotización (2–4 sem) +
  decisión + contrato + provisioning (4–10 sem) + curva Cognos = utilizable semanas 12–18
  en el caso mediano, o sea **post-go-live**. Si el founder firma antes de la semana 6,
  el detalle claims-level (allowable pre-remittance, denial codes reales) entra en las
  semanas 18–22. **Decisión founder semana 6: firmar o matar eBO** — sin fecha de decisión
  es como estas cosas derivan para siempre.
- **🏁 HITO M3 (semana 13):** Revenue + Insurance & Billing con datos reales *estándar*.

### Fase 7 — Captura de leads y datos manuales (semanas 3–10 · 3 ago–25 sep · office manager + dev compartido)

Lo que ningún bot puede scrapear porque **no existe el sistema** — y por eso arranca
temprano, no en la mitad del proyecto (es la mitad de la ruta crítica real):

- **Semanas 3–4: formulario interino de leads en producción** (Google Form/Airtable/Tally
  → import nocturno a Postgres) con los campos del funnel: stage con timestamps (Lead →
  Contacted → Onboarding → Patient → 1st appt), coordinator, source, decline reason.
  La decisión de herramienta se tomó en la semana 2 (default: formulario propio).
  Cada semana antes de esto es historia de funnel irrecuperable.
- **Adopción: 4–6 semanas con criterio de salida, no con fecha.** Métrica semanal de
  cumplimiento — entradas registradas vs procedimientos reales de ECW (¡el denominador se
  puede calcular!) — revisada con el founder; salida = **≥90% dos semanas seguidas**.
  Con arranque en semana 4, la adopción cierra ~semana 10 y deja 3+ semanas de holgura
  antes de la validación (F9). Capturas atadas a rituales existentes: el conteo de lockbox
  ya pasa cada EOD (colgarle el form); stars/misses donde la MA ya documenta el stick.
- Decisión que el founder debe comunicar **antes** del rollout: ¿la captura manual afecta
  evaluaciones de desempeño? Si el staff sospecha que sí, van a inflar los números.
- Superficies de captura/edición: targets por rol/empleado y goals (con dueño), tallies
  (stars/misses, upsells, % dripping, lockbox), roster de turnos, tracker de revisión
  semanal (fecha, revisores, estado — 3 campos), y las superficies admin de las tablas
  config sembradas en F1.

### Fase 8 — Integración continua del dashboard (semanas 4–14 · 10 ago–23 oct · Dev B)

**No es una fase final: es un carril continuo, vista por vista, desde la semana 4** (así
es como M1 y M2 son posibles). Orden: Today + Overview (S4–5) → Team/Employees con 8x8
(S8–9) → Marketing (S9) → Revenue/Billing (S11–13) → Patients/Journey (S12–14).

- **El frontend hoy no tiene plomería de datos:** los `get*` de `src/data/mockData.ts` son
  síncronos y se llaman directo en el render — no hay fetch, ni loading, ni estados de
  error, ni auth. La primera entrega de este carril (S4–5, ~1.5–2 semanas-dev) es el
  esqueleto: capa de datos async con loading/error states + la primera vista cableada.
  El contrato de tipos de `src/types.ts` sí se conserva.
- Filtros pasan de multiplicadores fake a queries reales: rango de fechas particionado,
  cash/insurance real por registro. Deltas leen los snapshots acumulados desde la semana 3.
- **Patient Journey es una mini-app, no un JSON:** nombres/teléfonos/emails no pueden
  servirse como JSON estático detrás de una contraseña compartida. Entrega propia
  (1.5–2 semanas dentro de F8): API read-only con login por usuario, scoping por rol
  (mínimo necesario) y log de accesos a PHI. **Alternativa que el founder decide en la
  semana 6:** descopar la v1 a iniciales + MRN + coordinator (sin contacto), que elimina
  casi toda la carga y quizá alcanza.
- **Construcción de UI nueva (no cableado):** las secciones PCC / Nurses / Medics no
  existen en la vista Team y dos de los 7 goals del Overview las referencian — o se
  construyen sobre los datos de tallies de F7 (~1 semana) o esos 2 goals se descopan del
  go-live explícitamente.

### Fase 9 — Validación anclada al cierre de mes y estabilización (semanas 14–17 · 19 oct–13 nov)

- Corrida en paralelo con validación **por tipo de dato**: cash/operacional contra la
  realidad conocida del founder y office manager (revenue del día, citas, llamadas);
  **seguros contra el cierre de mes de octubre con el biller** (2–4 h, inicios de
  noviembre) — los pagos de payers tardan 2–6+ semanas, así que validar "collected" de
  octubre antes de noviembre es validar contra datos inmaduros.
- Feature permanente del producto (no tarea de validación): métricas de seguros con menos
  de **45 días se muestran "provisional"** en el dashboard. La validación de denial rate
  necesita ventanas de 60–90 días y **termina post-go-live, y lo decimos**.
- Slot formal para **re-litigar las reglas de atribución de revenue** ahora que el staff
  las ve en pantalla (va a pasar; mejor agendado que absorbido como caos).
- Runbooks: scraper roto, rotación de credenciales, re-auth MFA, "nadie entra como el bot".

### Buffer nombrado (semana 18 · 16–20 nov)

Absorbe lo que este plan sabe que existe: ausencias, break-fix acumulado de pipes vivos,
decisiones que llegaron tarde. Si llega vacío, el go-live se adelanta.

**🏁 HITO M4 (semana 18):** go-live. Funnel, tallies manuales y seguros recientes llevan
etiqueta "provisional" hasta que su historia madure (semanas 18–22).

---

## 4. Riesgos principales y planes B

| # | Riesgo | Prob. | Impacto | Mitigación / Plan B |
|---|---|---|---|---|
| R1 | ECW resulta **self-hosted** (¡riesgo positivo!) | Media | −4 sem | SQL directo a MySQL; F2/F3/F6 se comprimen |
| R2 | Reportes ECW **no programables** en nuestra licencia | **Alta** | Ninguno en M1 | La ruta oficial de M1 ya es la descarga manual; el bot (F3) automatiza después |
| R3 | **eBO caro o lento** | Alta | Detalle billing post-go-live | Billing v1 con reportes estándar es el default; eBO es upgrade con decisión en semana 6 |
| R4 | Update de ECW **rompe el bot** | Alta (recurrente) | 1–2 días por evento, compite con el build | Selectores robustos, tripwires de vacíos/truncados; ya presupuestado en el paso de 16→18 semanas |
| R5 | No hay seat 8x8 **X4+** (sin él no hay NINGÚN camino 8x8) | Media | +1–2 sem | Comprar seat en semana 1; es la primera pregunta del checklist |
| R6 | **Nadie tiene admin de ECW** / security class insuficiente | Media | +2–6 sem | Identificarlo día 1; ticket a ECW en semana 1, no en semana 4 |
| R7 | El staff **no adopta** la captura de leads/tallies | Media–alta | Funnel/Journey débiles | Formularios <30 seg atados a rituales, métrica de cumplimiento semanal, criterio ≥90%×2sem, arranque en S4 deja re-intentos |
| R8 | **Papeleo BAA/SRA se estanca** en la firma del founder | Media | Bloquea acceso a PHI (sem 3) | Fecha + default en la lista de decisiones; plantillas listas en semana 1 |
| R9 | Push descuidado publica **datos reales en Pages público** | — | Incidente reportable | Deploy neutralizado el día 1 (gate de M1); CI que falla si el build público referencia API real |
| R10 | Reportes ECW con **row caps/truncamiento silencioso** | Media | Datos parciales invisibles | Tripwire footer-total vs filas parseadas; exports partidos por rango de fecha |
| R11 | Cuentas de terceros en manos de **agencia/MSP** (Meta BM, 8x8 admin) | Media | +días–semanas | Preguntas de ownership en semana 1; migrar/reclamar assets como tarea con dueño |
| R12 | MFA/política de sesión de ECW cambia | Media | +2–5 días | Cuenta de servicio dedicada, TOTP re-enrolable, humano-en-el-loop documentado |
| R13 | **Ausencias/enfermedad** en 4 meses (agosto, Labor Day) | Alta | ~1–1.5 sem por dev | Presupuestado: es parte de la diferencia 16→18; carriles con dueño único evitan bloqueos cruzados |
| R14 | Subestimación general (falacia de planificación) | — | — | ×1.5 dev propio, ×2–3 calendario en terceros (aplicado también a eBO y EHI); buffer terminal nombrado |

## 5. Después del go-live: maduración y mantenimiento

Esto no termina en la semana 18:

- **Semanas 18–22 (maduración):** denial rate con ventana suficiente, funnel con historia
  creíble, tallies estabilizados, y detalle eBO si se firmó a tiempo. Las etiquetas
  "provisional" se van cayendo solas.
- **2–5 h/semana** de mantenimiento estable (la industria subestima esto 4–6×).
- Picos de **1–2 días** cuando ECW cambia de versión o Meta depreca métricas (son
  recurrentes y hay olas de deprecación de Meta ya anunciadas).
- Cada fuente que migre de scraping a API/reporte oficial (eBO, FHIR ganando cobertura)
  **reduce a la mitad** su parte del mantenimiento.

## 6. Decisiones del founder (con fecha y default)

| Semana | Decisión | Default si no se decide |
|---|---|---|
| 1 | Presupuesto seat 8x8 X4 · autorizar cotización eBO · firmar BAA dev · ok neutralizar Pages | Sin seat no hay datos 8x8 (se acepta el hueco); Pages se neutraliza igual (no negociable con PHI) |
| 2 | Dónde se capturan leads · definiciones de métricas · cadencia Today · reglas de atribución v0 | Formulario propio; definiciones propuestas por el equipo; Today diario con badge; atribución simple por rendering provider |
| 6 | Firmar o matar **eBO** · alcance de **Patient Journey** v1 (mini-app con RBAC vs versión sin datos de contacto) | eBO muerto (billing v1 queda); Journey descopado a iniciales+MRN |
| 15–16 | Sign-off de validación (anclada al cierre de octubre) | No hay default: sin sign-off no hay go-live |
