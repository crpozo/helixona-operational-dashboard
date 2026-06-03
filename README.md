# Helixona · Operational Dashboard

Dashboard operacional para clínica (IV therapy / wellness) construido para que
el fundador sea una **"lupa"** sobre el negocio: controlar empleados, entender
el revenue y leer toda la operación con datos, métricas y KPIs.

> ⚠️ **Toda la data actual es placeholder / demo.** Está aislada en
> [`src/data/mockData.ts`](src/data/mockData.ts) para que sea trivial
> reemplazarla por integraciones reales sin tocar la UI.

## Qué incluye

5 vistas, con filtros globales de **rango de tiempo** (semana / mes / trimestre /
año) y **tipo de pago** (cash / insurance / todo) en el header:

| Vista | Qué muestra |
|-------|-------------|
| **Resumen ejecutivo** | KPIs vivos (revenue, revenue/empleado, pacientes activos, ticket/paciente, nuevos, espera próx. cita, ocupación, IVs), tendencia de revenue cash vs insurance, embudo de pacientes, revenue por modalidad y alertas operativas. |
| **Revenue** | Revenue mensual apilado, mix cash/insurance y tabla de revenue + ticket por modalidad. |
| **Pacientes** | Embudo lead → onboarding → paciente → 1ª cita, pipeline de nuevos (pendientes / onboarded / waitlist / declined) y mix por modalidad. |
| **Equipo & Roles** | KPIs por rol con metas y leaderboard por persona: Front Desk, Medical Assistants, PCC, Nurses, Medics, New Patient Team. Incluye roll-up para managers. |
| **Ocupación** | Uso de unidades (sillas/camas) vs capacidad y curva de ocupación por hora del día. |

## Métricas por rol (según las notas de la operación)

- **Front Desk** — cobranza insurance, ventas cash, llamadas atendidas/salientes
- **Medical Assistants** — inquiries, vitals, procedimientos, Rx refills
- **PCC** — citas POC, follow-ups, ventas cash, penetración POC, % "dripping"
- **Nurses** — EBOOs, sticks, misses, EBOO agendados, upsells ($)
- **Medics** — starts, misses ($3.20/miss), citas agendadas, upsells, caja EOD
- **New Patient Team** — leads, llamadas salientes, onboarded, waitlist, declined

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts (gráficas)
- lucide-react (iconos)

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción a dist/
npm run lint     # type-check (tsc --noEmit)
```

## Conectar datos reales

Las fuentes esperadas (según notas) son **ECW (eClinicalWorks)** para pacientes,
citas y procedimientos, **8x8** para llamadas, y **billing** para cobranza.

Para conectar producción, reemplaza las funciones `get*` en
`src/data/mockData.ts` por llamadas a tu API manteniendo las mismas firmas de
tipos definidas en [`src/types.ts`](src/types.ts). La capa de UI no necesita
cambios.

### Próximos pasos sugeridos (de las notas)

- Landing page dedicada para **EBOO** (alta demanda)
- Funnel de email para nuevos leads
- Tracking de "distancia"/tiempo de lead → paciente
- Reportes por unidad/sede y análisis comparativo entre clínicas
