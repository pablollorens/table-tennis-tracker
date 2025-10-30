# 🏓 Office Ping Pong - Documentación del Proyecto

## 📋 Índice
1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Mobile-First & PWA](#mobile-first--pwa)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Modelo de Datos](#modelo-de-datos)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Sistema de Puntuación ELO](#sistema-de-puntuación-elo)
8. [Funcionalidades Principales](#funcionalidades-principales)
9. [Guía de Implementación Paso a Paso](#guía-de-implementación-paso-a-paso)
10. [Componentes UI Detallados](#componentes-ui-detallados)
11. [Lógica de Negocio](#lógica-de-negocio)
12. [Firebase Rules](#firebase-rules)
13. [Testing](#testing)
14. [Deployment](#deployment)

---

## 1. Visión General

### Objetivo
Crear una aplicación web para registrar y visualizar estadísticas de partidos de ping-pong en la oficina, con un sistema de ranking basado en ELO rating.

### Características Principales
- ✅ Acceso protegido con password compartida (sin cuentas individuales)
- ✅ Selección diaria de jugadores activos
- ✅ Generación automática de todos los enfrentamientos posibles (round-robin)
- ✅ Registro rápido de resultados de partidos
- ✅ Sistema de ranking ELO dinámico
- ✅ Estadísticas individuales y globales
- ✅ Historial completo de partidos
- ✅ Visualización de gráficos y tendencias
- ✅ **Progressive Web App (PWA)** - Instalable, funciona offline
- ✅ **Mobile-First** - Optimizado para dispositivos móviles

### Usuario Tipo
Empleados de oficina que juegan ping-pong regularmente y quieren trackear sus resultados de forma sencilla desde sus teléfonos móviles.

---

## 2. Stack Tecnológico

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **PWA**: next-pwa + Workbox (service workers, caching)
- **UI Components**: Shadcn/ui (touch-optimized, 44px min targets)
- **Styling**: Tailwind CSS (mobile-first breakpoints)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date**: date-fns

### Backend
- **BaaS**: Firebase
  - Firestore Database (con offline persistence)
  - Authentication (password compartida hasheada)
  - **NO se usa**: Firebase Hosting ni Cloud Functions

### Deployment
- **Hosting**: Vercel (recomendado - mejor para Next.js)
- **Database**: Firebase Firestore (accedido vía SDK desde Vercel)
- **Arquitectura**: Frontend en Vercel + Backend/DB en Firebase

### Herramientas de Desarrollo
- TypeScript
- ESLint
- Prettier

### Mobile & PWA Considerations
- **Enfoque**: Mobile-first, portrait orientation
- **PWA Features**: Instalable, offline support, app shortcuts
- **Performance Target**: Lighthouse PWA ≥ 90, LCP < 2.5s on 3G
- **Offline**: View cached data + queue match results for sync

---

## 3. Mobile-First & PWA

> **📱 Enfoque Principal**: Esta aplicación está diseñada primero para móviles como Progressive Web App (PWA).
>
> **📄 Documentación Completa**: Ver [`docs/plans/2025-10-31-mobile-pwa-design.md`](./plans/2025-10-31-mobile-pwa-design.md) para especificaciones detalladas.

### Decisiones de Diseño Mobile

**Pantallas de Diseño Disponibles:**
Todos los diseños móviles están en [`docs/design_specs/`](./design_specs/) con capturas de pantalla y código HTML:
1. **Login Screen** - Password compartida con estados de error
2. **Player Selection** - Búsqueda y selección con checkboxes
3. **Dashboard (Home)** - Resumen de sesión del día
4. **Today's Matches** - Lista de partidos pendientes/completados
5. **Match Result Recording** - Modal bottom sheet para registrar resultados
6. **Ranking Leaderboard** - Tabla de clasificación con avatares y estadísticas

### Arquitectura PWA

**Configuración Next.js PWA:**
```bash
npm install next-pwa
```

**Features PWA Implementadas:**
- ✅ **Instalable**: Manifest.json configurado, install prompt después de 2da visita
- ✅ **Offline-first**: Service worker con estrategias de caché balanceadas
- ✅ **Background sync**: Match results en cola si sin conexión
- ✅ **App shortcuts**: Accesos rápidos desde icono instalado
- ✅ **Splash screen**: Pantalla de carga con branding

**Service Worker Strategies:**
- **Static assets** (JS, CSS, images): Cache-first
- **Match data & sessions**: Network-first with cache fallback
- **Player data**: Stale-while-revalidate
- **Offline queue**: IndexedDB para match results pendientes

### Patrones Mobile UI/UX

**Touch Optimization:**
- Todos los botones/links: **≥ 44x44px** (estándar iOS/Android)
- Espaciado entre elementos: **≥ 8px**
- Bottom sheet modals (más accesibles que modales centrados)

**Navigation Pattern:**
- **Bottom tab bar** (Dashboard, Rankings, Profile)
- **Floating Action Button (FAB)** para acciones primarias
- **Pull-to-refresh** en listas (Today's Matches, Leaderboard)

**Mobile Gestures (opcional):**
- Swipe right en match card → Quick record winner
- Swipe left en match card → Skip match
- Pull down → Refresh data

**Haptic Feedback:**
- Button press: Vibración ligera (10ms)
- Match recorded: Vibración de éxito (20ms, 2 pulsos)
- Error: Vibración de error (30ms, 3 pulsos)

### Capacidades Offline (Enfoque Balanceado)

**Funciona Offline:**
- ✅ Ver dashboard (datos en caché)
- ✅ Ver partidos del día (último estado sincronizado)
- ✅ Ver rankings (datos en caché)
- ✅ Registrar resultados de partidos (queued para sync)
- ❌ Crear nueva sesión (requiere red)
- ❌ Agregar nuevos jugadores (requiere red)

**Sincronización Automática:**
- Cuando vuelve conexión → Auto-sync de match results en cola
- Toast notification: "Synced 3 match result(s)"
- Indicador offline visible en top de pantalla

### Performance Targets

**Lighthouse Scores (Enfoque Balanceado):**
- Performance: **≥ 85**
- Accessibility: **≥ 95**
- Best Practices: **≥ 95**
- SEO: **≥ 90**
- PWA: **≥ 90**

**Core Web Vitals (3G):**
- LCP (Largest Contentful Paint): **< 2.5s**
- FID (First Input Delay): **< 100ms**
- CLS (Cumulative Layout Shift): **< 0.1**

**Bundle Size:**
- Initial JS: **< 200kb** (gzipped)
- CSS: **< 50kb** (gzipped)

---

## 4. Estructura del Proyecto

```
office-ping-pong/
├── app/
│   ├── layout.tsx                 # Layout principal
│   ├── page.tsx                   # Home/Login
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── today/
│   │   │   └── page.tsx          # Partidos del día
│   │   ├── ranking/
│   │   │   └── page.tsx          # Tabla de clasificación
│   │   ├── history/
│   │   │   └── page.tsx          # Historial de partidos
│   │   ├── players/
│   │   │   └── page.tsx          # Gestión de jugadores
│   │   └── stats/
│   │       └── page.tsx          # Estadísticas detalladas
│   ├── api/
│   │   └── (rutas API si necesario)
│   └── globals.css
│
├── components/
│   ├── ui/                        # Componentes Shadcn
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── auth/
│   │   └── password-gate.tsx     # Componente de autenticación
│   ├── players/
│   │   ├── player-selector.tsx   # Selector de jugadores del día
│   │   ├── player-card.tsx       # Card de jugador
│   │   └── player-form.tsx       # Formulario crear/editar jugador
│   ├── matches/
│   │   ├── match-list.tsx        # Lista de partidos
│   │   ├── match-card.tsx        # Card de partido individual
│   │   ├── match-result-form.tsx # Formulario de resultado
│   │   └── match-generator.tsx   # Generador de partidos
│   ├── ranking/
│   │   ├── leaderboard.tsx       # Tabla de clasificación
│   │   └── player-stats.tsx      # Estadísticas de jugador
│   └── charts/
│       ├── elo-history-chart.tsx # Gráfico de evolución ELO
│       └── wins-losses-chart.tsx # Gráfico victorias/derrotas
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts             # Configuración Firebase
│   │   ├── auth.ts               # Funciones de autenticación
│   │   ├── firestore.ts          # Funciones Firestore
│   │   └── hooks.ts              # Custom hooks Firebase
│   ├── elo/
│   │   └── calculator.ts         # Sistema de cálculo ELO
│   ├── utils/
│   │   ├── date.ts               # Utilidades de fecha
│   │   ├── round-robin.ts        # Generador round-robin
│   │   └── validators.ts         # Validadores Zod
│   └── utils.ts                  # Utilidades generales
│
├── types/
│   ├── player.ts                 # Tipos de jugador
│   ├── match.ts                  # Tipos de partido
│   ├── session.ts                # Tipos de sesión
│   └── index.ts                  # Exports
│
├── hooks/
│   ├── use-players.ts            # Hook para jugadores
│   ├── use-matches.ts            # Hook para partidos
│   ├── use-session.ts            # Hook para sesión actual
│   └── use-auth.ts               # Hook para autenticación
│
├── constants/
│   └── index.ts                  # Constantes globales
│
├── public/
│   └── avatars/                  # Avatares de jugadores
│
├── .env.local                    # Variables de entorno
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 4. Modelo de Datos

### Firestore Collections

#### **Collection: `config`**
Configuración global de la aplicación.

```typescript
// Document ID: "app"
{
  passwordHash: string,           // Hash bcrypt de la password
  currentSessionDate: string,     // "2025-10-27" (YYYY-MM-DD)
  eloKFactor: number,            // 32 (factor K para cálculo ELO)
  defaultEloRating: number,      // 1200 (ELO inicial)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **Collection: `players`**
Jugadores registrados en el sistema.

```typescript
// Document ID: auto-generado
{
  id: string,                    // ID del documento
  name: string,                  // "Ana García"
  nickname: string,              // "Ana" (opcional)
  email: string,                 // "ana@company.com" (opcional)
  avatar: string,                // URL o iniciales "AG"
  eloRating: number,             // 1250
  stats: {
    totalMatches: number,        // 45
    wins: number,                // 28
    losses: number,              // 17
    winRate: number,             // 0.622 (62.2%)
    highestElo: number,          // 1380
    lowestElo: number,           // 1150
    currentStreak: number,       // 3 (positivo: victorias, negativo: derrotas)
    longestWinStreak: number,    // 8
    longestLoseStreak: number,   // 4
  },
  isActive: boolean,             // true
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **Collection: `sessions`**
Sesiones de juego por día.

```typescript
// Document ID: "2025-10-27" (YYYY-MM-DD)
{
  date: string,                  // "2025-10-27"
  players: string[],             // ["playerId1", "playerId2", "playerId3"]
  totalMatches: number,          // 6 (número de combinaciones)
  completedMatches: number,      // 4
  pendingMatches: number,        // 2
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **Collection: `matches`**
Partidos individuales (subcollection de sessions).

```typescript
// Path: sessions/{sessionDate}/matches/{matchId}
{
  id: string,                    // ID del documento
  sessionDate: string,           // "2025-10-27"
  player1: {
    id: string,                  // "playerId1"
    name: string,                // "Ana"
    score: number | null,        // 11
    eloBefore: number,           // 1250
    eloAfter: number | null,     // 1258
    eloChange: number | null,    // +8
  },
  player2: {
    id: string,                  // "playerId2"
    name: string,                // "Carlos"
    score: number | null,        // 7
    eloBefore: number,           // 1180
    eloAfter: number | null,     // 1172
    eloChange: number | null,    // -8
  },
  winnerId: string | null,       // "playerId1"
  status: "pending" | "completed" | "skipped",
  playedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **Collection: `matchHistory`**
Historial global de todos los partidos jugados (para consultas rápidas).

```typescript
// Document ID: auto-generado
{
  id: string,
  sessionDate: string,           // "2025-10-27"
  player1Id: string,
  player1Name: string,
  player1Score: number,
  player1EloChange: number,
  player2Id: string,
  player2Name: string,
  player2Score: number,
  player2EloChange: number,
  winnerId: string,
  winnerName: string,
  playedAt: Timestamp,
  createdAt: Timestamp
}
```

---

## 5. Sistema de Autenticación

### Concepto
- **Password única compartida** para acceder a la aplicación
- No hay cuentas de usuario individuales
- La password se guarda hasheada en Firestore
- Se usa localStorage para mantener la sesión

### Implementación

#### **Archivo: `lib/firebase/auth.ts`**

```typescript
import bcrypt from 'bcryptjs';

const APP_PASSWORD_KEY = 'pingpong_auth';

// Verificar password
export async function verifyPassword(password: string): Promise<boolean> {
  // En producción, obtener el hash desde Firestore
  const storedHash = await getPasswordHashFromFirestore();
  return bcrypt.compare(password, storedHash);
}

// Guardar sesión en localStorage
export function saveSession(): void {
  localStorage.setItem(APP_PASSWORD_KEY, 'authenticated');
}

// Verificar si hay sesión activa
export function isAuthenticated(): boolean {
  return localStorage.getItem(APP_PASSWORD_KEY) === 'authenticated';
}

// Cerrar sesión
export function logout(): void {
  localStorage.removeItem(APP_PASSWORD_KEY);
}

// Obtener hash desde Firestore
async function getPasswordHashFromFirestore(): Promise<string> {
  const configRef = doc(db, 'config', 'app');
  const configSnap = await getDoc(configRef);
  return configSnap.data()?.passwordHash || '';
}

// Función admin para cambiar password
export async function updatePassword(newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  const configRef = doc(db, 'config', 'app');
  await updateDoc(configRef, { passwordHash: hash });
}
```

#### **Componente: `components/auth/password-gate.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { verifyPassword, saveSession } from '@/lib/firebase/auth';

export function PasswordGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await verifyPassword(password);
      
      if (isValid) {
        saveSession();
        router.push('/dashboard');
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      setError('Error al verificar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🏓</h1>
          <h2 className="text-2xl font-semibold">Office Ping Pong</h2>
          <p className="text-gray-500 mt-2">Ingresa la contraseña del equipo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

---

## 6. Sistema de Puntuación ELO

### ¿Qué es ELO?
Sistema de clasificación desarrollado para ajedrez que calcula la probabilidad de victoria entre dos jugadores basándose en sus ratings actuales.

### Características
- Un jugador débil que vence a uno fuerte gana muchos puntos
- Un jugador fuerte que vence a uno débil gana pocos puntos
- El sistema se auto-balancea con el tiempo
- Rating inicial: 1200 puntos
- Factor K: 32 (velocidad de cambio)

### Fórmula

```
Probabilidad esperada de victoria:
E_A = 1 / (1 + 10^((R_B - R_A) / 400))

Nuevo rating:
R_A_new = R_A + K * (S_A - E_A)

Donde:
- R_A, R_B = Ratings actuales de jugador A y B
- K = Factor K (32)
- S_A = Resultado real (1 si gana, 0 si pierde)
- E_A = Probabilidad esperada de victoria
```

### Implementación

#### **Archivo: `lib/elo/calculator.ts`**

```typescript
export interface EloCalculationResult {
  winnerNewElo: number;
  loserNewElo: number;
  winnerChange: number;
  loserChange: number;
  expectedWinProbability: number;
}

export interface EloCalculationParams {
  winnerElo: number;
  loserElo: number;
  kFactor?: number;
}

/**
 * Calcula los cambios de ELO después de un partido
 */
export function calculateEloChange({
  winnerElo,
  loserElo,
  kFactor = 32
}: EloCalculationParams): EloCalculationResult {
  // Probabilidad esperada de que el ganador gane
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  
  // Probabilidad esperada de que el perdedor gane
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  
  // Cambio de ELO
  const winnerChange = Math.round(kFactor * (1 - expectedWinner));
  const loserChange = Math.round(kFactor * (0 - expectedLoser));
  
  // Nuevos ratings
  const winnerNewElo = winnerElo + winnerChange;
  const loserNewElo = loserElo + loserChange;
  
  return {
    winnerNewElo: Math.round(winnerNewElo),
    loserNewElo: Math.round(loserNewElo),
    winnerChange,
    loserChange,
    expectedWinProbability: expectedWinner
  };
}

/**
 * Predice el resultado esperado entre dos jugadores
 */
export function predictMatchOutcome(player1Elo: number, player2Elo: number): {
  player1WinProbability: number;
  player2WinProbability: number;
  expectedPointsGain: number;
} {
  const player1WinProb = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
  const player2WinProb = 1 - player1WinProb;
  
  // Puntos esperados si player1 gana
  const expectedPoints = Math.round(32 * (1 - player1WinProb));
  
  return {
    player1WinProbability: Math.round(player1WinProb * 100) / 100,
    player2WinProbability: Math.round(player2WinProb * 100) / 100,
    expectedPointsGain: expectedPoints
  };
}

/**
 * Obtiene una descripción del cambio de ELO
 */
export function getEloChangeDescription(change: number): string {
  const absChange = Math.abs(change);
  
  if (absChange >= 30) return 'Cambio masivo';
  if (absChange >= 20) return 'Cambio grande';
  if (absChange >= 10) return 'Cambio moderado';
  if (absChange >= 5) return 'Cambio pequeño';
  return 'Cambio mínimo';
}

/**
 * Obtiene color para representar el cambio de ELO
 */
export function getEloChangeColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
}
```

### Ejemplos de Cálculo

```typescript
// Ejemplo 1: Jugador débil vence a jugador fuerte
const result1 = calculateEloChange({
  winnerElo: 1000,  // Jugador débil
  loserElo: 1400,   // Jugador fuerte
  kFactor: 32
});
// Resultado:
// winnerChange: +29
// loserChange: -29
// El jugador débil gana muchos puntos por la sorpresa

// Ejemplo 2: Jugador fuerte vence a jugador débil
const result2 = calculateEloChange({
  winnerElo: 1400,  // Jugador fuerte
  loserElo: 1000,   // Jugador débil
  kFactor: 32
});
// Resultado:
// winnerChange: +3
// loserChange: -3
// El jugador fuerte gana pocos puntos (victoria esperada)

// Ejemplo 3: Jugadores de nivel similar
const result3 = calculateEloChange({
  winnerElo: 1200,
  loserElo: 1220,
  kFactor: 32
});
// Resultado:
// winnerChange: +17
// loserChange: -17
// Cambio moderado entre jugadores similares
```

---

## 7. Funcionalidades Principales

### 7.1. Gestión de Jugadores

**Crear nuevo jugador:**
```typescript
async function createPlayer(playerData: {
  name: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}) {
  const playersRef = collection(db, 'players');
  
  const newPlayer = {
    ...playerData,
    eloRating: 1200, // ELO inicial
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      highestElo: 1200,
      lowestElo: 1200,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(playersRef, newPlayer);
  return { id: docRef.id, ...newPlayer };
}
```

**Actualizar estadísticas de jugador:**
```typescript
async function updatePlayerStats(
  playerId: string,
  matchResult: 'win' | 'loss',
  eloChange: number
) {
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);
  const player = playerSnap.data();
  
  const newElo = player.eloRating + eloChange;
  const newTotalMatches = player.stats.totalMatches + 1;
  const newWins = matchResult === 'win' ? player.stats.wins + 1 : player.stats.wins;
  const newLosses = matchResult === 'loss' ? player.stats.losses + 1 : player.stats.losses;
  const newWinRate = newWins / newTotalMatches;
  
  // Actualizar racha
  let newStreak = player.stats.currentStreak;
  if (matchResult === 'win') {
    newStreak = newStreak >= 0 ? newStreak + 1 : 1;
  } else {
    newStreak = newStreak <= 0 ? newStreak - 1 : -1;
  }
  
  const updates = {
    eloRating: newElo,
    'stats.totalMatches': newTotalMatches,
    'stats.wins': newWins,
    'stats.losses': newLosses,
    'stats.winRate': newWinRate,
    'stats.highestElo': Math.max(player.stats.highestElo, newElo),
    'stats.lowestElo': Math.min(player.stats.lowestElo, newElo),
    'stats.currentStreak': newStreak,
    'stats.longestWinStreak': matchResult === 'win' 
      ? Math.max(player.stats.longestWinStreak, Math.abs(newStreak))
      : player.stats.longestWinStreak,
    'stats.longestLoseStreak': matchResult === 'loss'
      ? Math.max(player.stats.longestLoseStreak, Math.abs(newStreak))
      : player.stats.longestLoseStreak,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(playerRef, updates);
}
```

### 7.2. Generación de Partidos (Round-Robin)

**Algoritmo Round-Robin:**
```typescript
// lib/utils/round-robin.ts

export interface MatchPairing {
  player1Id: string;
  player2Id: string;
}

/**
 * Genera todas las combinaciones posibles de partidos
 * entre los jugadores seleccionados (round-robin)
 */
export function generateRoundRobin(playerIds: string[]): MatchPairing[] {
  const matches: MatchPairing[] = [];
  
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      matches.push({
        player1Id: playerIds[i],
        player2Id: playerIds[j]
      });
    }
  }
  
  return matches;
}

/**
 * Calcula el número total de partidos para N jugadores
 * Fórmula: n * (n - 1) / 2
 */
export function calculateTotalMatches(numPlayers: number): number {
  return (numPlayers * (numPlayers - 1)) / 2;
}

// Ejemplo:
// 4 jugadores → 6 partidos
// 5 jugadores → 10 partidos
// 6 jugadores → 15 partidos
```

**Crear sesión del día:**
```typescript
async function createDailySession(selectedPlayerIds: string[]) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const sessionRef = doc(db, 'sessions', today);
  
  // Verificar si ya existe una sesión hoy
  const sessionSnap = await getDoc(sessionRef);
  if (sessionSnap.exists()) {
    throw new Error('Ya existe una sesión para hoy');
  }
  
  // Generar partidos
  const matchPairings = generateRoundRobin(selectedPlayerIds);
  
  // Crear sesión
  const session = {
    date: today,
    players: selectedPlayerIds,
    totalMatches: matchPairings.length,
    completedMatches: 0,
    pendingMatches: matchPairings.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(sessionRef, session);
  
  // Crear partidos en subcollection
  const matchesRef = collection(db, `sessions/${today}/matches`);
  
  for (const pairing of matchPairings) {
    const player1Data = await getPlayerData(pairing.player1Id);
    const player2Data = await getPlayerData(pairing.player2Id);
    
    const match = {
      sessionDate: today,
      player1: {
        id: pairing.player1Id,
        name: player1Data.name,
        score: null,
        eloBefore: player1Data.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      player2: {
        id: pairing.player2Id,
        name: player2Data.name,
        score: null,
        eloBefore: player2Data.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      winnerId: null,
      status: 'pending',
      playedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(matchesRef, match);
  }
  
  return session;
}
```

### 7.3. Registro de Resultado de Partido

```typescript
async function recordMatchResult(
  sessionDate: string,
  matchId: string,
  result: {
    player1Score: number;
    player2Score: number;
    winnerId: string;
  }
) {
  const matchRef = doc(db, `sessions/${sessionDate}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);
  const match = matchSnap.data();
  
  // Determinar ganador y perdedor
  const isPlayer1Winner = result.winnerId === match.player1.id;
  const winnerData = isPlayer1Winner ? match.player1 : match.player2;
  const loserData = isPlayer1Winner ? match.player2 : match.player1;
  
  // Calcular cambios de ELO
  const eloResult = calculateEloChange({
    winnerElo: winnerData.eloBefore,
    loserElo: loserData.eloBefore,
    kFactor: 32
  });
  
  // Actualizar partido
  const updates = {
    'player1.score': result.player1Score,
    'player1.eloAfter': isPlayer1Winner ? eloResult.winnerNewElo : eloResult.loserNewElo,
    'player1.eloChange': isPlayer1Winner ? eloResult.winnerChange : eloResult.loserChange,
    'player2.score': result.player2Score,
    'player2.eloAfter': isPlayer1Winner ? eloResult.loserNewElo : eloResult.winnerNewElo,
    'player2.eloChange': isPlayer1Winner ? eloResult.loserChange : eloResult.winnerChange,
    winnerId: result.winnerId,
    status: 'completed',
    playedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(matchRef, updates);
  
  // Actualizar estadísticas de jugadores
  await updatePlayerStats(
    winnerData.id,
    'win',
    isPlayer1Winner ? eloResult.winnerChange : eloResult.winnerChange
  );
  
  await updatePlayerStats(
    loserData.id,
    'loss',
    isPlayer1Winner ? eloResult.loserChange : eloResult.loserChange
  );
  
  // Actualizar contador de sesión
  const sessionRef = doc(db, 'sessions', sessionDate);
  await updateDoc(sessionRef, {
    completedMatches: increment(1),
    pendingMatches: increment(-1),
    updatedAt: serverTimestamp()
  });
  
  // Guardar en historial global
  await addToMatchHistory({
    sessionDate,
    player1Id: match.player1.id,
    player1Name: match.player1.name,
    player1Score: result.player1Score,
    player1EloChange: updates['player1.eloChange'],
    player2Id: match.player2.id,
    player2Name: match.player2.name,
    player2Score: result.player2Score,
    player2EloChange: updates['player2.eloChange'],
    winnerId: result.winnerId,
    winnerName: isPlayer1Winner ? match.player1.name : match.player2.name,
    playedAt: new Date()
  });
}
```

### 7.4. Ranking y Leaderboard

```typescript
async function getLeaderboard(limit: number = 10) {
  const playersRef = collection(db, 'players');
  const q = query(
    playersRef,
    where('isActive', '==', true),
    orderBy('eloRating', 'desc'),
    limit(limit)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

---

## 8. Guía de Implementación Paso a Paso

### Paso 1: Inicializar Proyecto Next.js

```bash
# Crear proyecto Next.js con TypeScript
npx create-next-app@latest office-ping-pong --typescript --tailwind --app --eslint

cd office-ping-pong

# Instalar dependencias adicionales
npm install firebase
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-checkbox
npm install lucide-react
npm install react-hook-form @hookform/resolvers zod
npm install recharts
npm install date-fns
npm install bcryptjs
npm install -D @types/bcryptjs

# Inicializar Shadcn/ui
npx shadcn@latest init

# Instalar componentes Shadcn necesarios
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add avatar
npx shadcn@latest add label
npx shadcn@latest add separator
```

### Paso 2: Configurar Firebase

**2.1. Crear proyecto en Firebase Console**
1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto: "office-ping-pong"
3. Activa Firestore Database
4. Configura reglas de seguridad (ver sección Firebase Rules)

**2.2. Obtener credenciales**
1. Project Settings > General
2. Copia las credenciales de tu app web

**2.3. Crear archivo `.env.local`**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

**2.4. Crear configuración Firebase**

Archivo: `lib/firebase/config.ts`
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase solo si no está inicializado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };
```

### Paso 3: Crear Tipos TypeScript

Archivo: `types/index.ts`
```typescript
import { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  avatar: string;
  eloRating: number;
  stats: PlayerStats;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  highestElo: number;
  lowestElo: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}

export interface Session {
  date: string;
  players: string[];
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Match {
  id: string;
  sessionDate: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  winnerId: string | null;
  status: 'pending' | 'completed' | 'skipped';
  playedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MatchPlayer {
  id: string;
  name: string;
  score: number | null;
  eloBefore: number;
  eloAfter: number | null;
  eloChange: number | null;
}

export interface MatchHistory {
  id: string;
  sessionDate: string;
  player1Id: string;
  player1Name: string;
  player1Score: number;
  player1EloChange: number;
  player2Id: string;
  player2Name: string;
  player2Score: number;
  player2EloChange: number;
  winnerId: string;
  winnerName: string;
  playedAt: Timestamp;
  createdAt: Timestamp;
}
```

### Paso 4: Implementar Lógica de Autenticación

Ya cubierto en la sección 5.

### Paso 5: Implementar Sistema ELO

Ya cubierto en la sección 6.

### Paso 6: Crear Custom Hooks

**Hook para jugadores: `hooks/use-players.ts`**
```typescript
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Player } from '@/types';

export function usePlayers(activeOnly: boolean = true) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const playersRef = collection(db, 'players');
    let q = query(playersRef, orderBy('eloRating', 'desc'));
    
    if (activeOnly) {
      q = query(playersRef, where('isActive', '==', true), orderBy('eloRating', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];
        
        setPlayers(playersData);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOnly]);

  return { players, loading, error };
}
```

**Hook para sesión actual: `hooks/use-session.ts`**
```typescript
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Session } from '@/types';
import { format } from 'date-fns';

export function useCurrentSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sessionRef = doc(db, 'sessions', today);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession({ date: today, ...snapshot.data() } as Session);
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { session, loading, error };
}
```

**Hook para partidos: `hooks/use-matches.ts`**
```typescript
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Match } from '@/types';
import { format } from 'date-fns';

export function useTodayMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const matchesRef = collection(db, `sessions/${today}/matches`);
    const q = query(matchesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];
        
        setMatches(matchesData);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { matches, loading, error };
}
```

### Paso 7: Crear Componentes UI

**Componente de selección de jugadores:**

Archivo: `components/players/player-selector.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { usePlayers } from '@/hooks/use-players';
import { createDailySession } from '@/lib/firebase/firestore';
import { calculateTotalMatches } from '@/lib/utils/round-robin';

export function PlayerSelector() {
  const { players, loading } = usePlayers();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleCreateSession = async () => {
    if (selectedPlayers.length < 2) {
      alert('Selecciona al menos 2 jugadores');
      return;
    }

    setCreating(true);
    try {
      await createDailySession(selectedPlayers);
      alert('Sesión creada exitosamente!');
    } catch (error) {
      alert('Error al crear sesión: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div>Cargando jugadores...</div>;

  const totalMatches = calculateTotalMatches(selectedPlayers.length);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Selecciona jugadores de hoy</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {players.map(player => (
          <div key={player.id} className="flex items-center space-x-2">
            <Checkbox
              id={player.id}
              checked={selectedPlayers.includes(player.id)}
              onCheckedChange={() => handleTogglePlayer(player.id)}
            />
            <label htmlFor={player.id} className="cursor-pointer">
              {player.name} ({player.eloRating})
            </label>
          </div>
        ))}
      </div>

      {selectedPlayers.length >= 2 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {selectedPlayers.length} jugadores seleccionados
            → {totalMatches} partidos a jugar
          </p>
        </div>
      )}

      <Button
        onClick={handleCreateSession}
        disabled={selectedPlayers.length < 2 || creating}
        className="w-full"
      >
        {creating ? 'Creando...' : 'Generar partidos'}
      </Button>
    </Card>
  );
}
```

**Componente de lista de partidos:**

Archivo: `components/matches/match-list.tsx`
```typescript
'use client';

import { MatchCard } from './match-card';
import { useTodayMatches } from '@/hooks/use-matches';

export function MatchList() {
  const { matches, loading, error } = useTodayMatches();

  if (loading) return <div>Cargando partidos...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (matches.length === 0) return <div>No hay partidos para hoy</div>;

  const pendingMatches = matches.filter(m => m.status === 'pending');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="space-y-8">
      {pendingMatches.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Pendientes ({pendingMatches.length})
          </h3>
          <div className="space-y-4">
            {pendingMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {completedMatches.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Completados ({completedMatches.length})
          </h3>
          <div className="space-y-4">
            {completedMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Componente de card de partido:**

Archivo: `components/matches/match-card.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Match } from '@/types';
import { MatchResultForm } from './match-result-form';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const [showForm, setShowForm] = useState(false);

  if (match.status === 'completed') {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <span className={match.winnerId === match.player1.id ? 'font-bold' : ''}>
                {match.player1.name}
              </span>
              <Badge variant={match.winnerId === match.player1.id ? 'default' : 'outline'}>
                {match.player1.score}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              ELO: {match.player1.eloChange! > 0 ? '+' : ''}{match.player1.eloChange}
            </div>
          </div>

          <div className="mx-4 text-gray-400">VS</div>

          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-4">
              <Badge variant={match.winnerId === match.player2.id ? 'default' : 'outline'}>
                {match.player2.score}
              </Badge>
              <span className={match.winnerId === match.player2.id ? 'font-bold' : ''}>
                {match.player2.name}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              ELO: {match.player2.eloChange! > 0 ? '+' : ''}{match.player2.eloChange}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium">{match.player1.name}</div>
          <div className="text-sm text-gray-500">ELO: {match.player1.eloBefore}</div>
        </div>

        <div className="mx-4">
          <Badge variant="outline">Pendiente</Badge>
        </div>

        <div className="flex-1 text-right">
          <div className="font-medium">{match.player2.name}</div>
          <div className="text-sm text-gray-500">ELO: {match.player2.eloBefore}</div>
        </div>
      </div>

      <div className="mt-4">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="w-full">
            Registrar resultado
          </Button>
        ) : (
          <MatchResultForm
            match={match}
            onCancel={() => setShowForm(false)}
            onSuccess={() => setShowForm(false)}
          />
        )}
      </div>
    </Card>
  );
}
```

**Componente de formulario de resultado:**

Archivo: `components/matches/match-result-form.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Match } from '@/types';
import { recordMatchResult } from '@/lib/firebase/firestore';

interface MatchResultFormProps {
  match: Match;
  onCancel: () => void;
  onSuccess: () => void;
}

export function MatchResultForm({ match, onCancel, onSuccess }: MatchResultFormProps) {
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const score1 = parseInt(player1Score);
    const score2 = parseInt(player2Score);

    if (isNaN(score1) || isNaN(score2)) {
      alert('Por favor ingresa puntajes válidos');
      return;
    }

    if (score1 === score2) {
      alert('No puede haber empate en ping pong');
      return;
    }

    const winnerId = score1 > score2 ? match.player1.id : match.player2.id;

    setSaving(true);
    try {
      await recordMatchResult(match.sessionDate, match.id, {
        player1Score: score1,
        player2Score: score2,
        winnerId
      });
      onSuccess();
    } catch (error) {
      alert('Error al guardar resultado: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="player1Score">{match.player1.name}</Label>
          <Input
            id="player1Score"
            type="number"
            min="0"
            max="21"
            value={player1Score}
            onChange={(e) => setPlayer1Score(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="player2Score">{match.player2.name}</Label>
          <Input
            id="player2Score"
            type="number"
            min="0"
            max="21"
            value={player2Score}
            onChange={(e) => setPlayer2Score(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
```

**Componente de leaderboard:**

Archivo: `components/ranking/leaderboard.tsx`
```typescript
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlayers } from '@/hooks/use-players';

export function Leaderboard() {
  const { players, loading } = usePlayers();

  if (loading) return <div>Cargando ranking...</div>;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">🏆 Ranking</h2>
      
      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="text-2xl font-bold text-gray-400 w-8">
              {index + 1}
            </div>
            
            <div className="flex-1">
              <div className="font-semibold">{player.name}</div>
              <div className="text-sm text-gray-500">
                {player.stats.wins}W - {player.stats.losses}L
                {' | '}
                {(player.stats.winRate * 100).toFixed(1)}% WR
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold">{player.eloRating}</div>
              <div className="text-xs text-gray-500">ELO</div>
            </div>

            {player.stats.currentStreak !== 0 && (
              <Badge variant={player.stats.currentStreak > 0 ? 'default' : 'destructive'}>
                {player.stats.currentStreak > 0 ? '🔥' : '❄️'}
                {Math.abs(player.stats.currentStreak)}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### Paso 8: Crear Páginas

**Página de login: `app/page.tsx`**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordGate } from '@/components/auth/password-gate';
import { isAuthenticated } from '@/lib/firebase/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  return <PasswordGate />;
}
```

**Layout del dashboard: `app/dashboard/layout.tsx`**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isAuthenticated, logout } from '@/lib/firebase/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex space-x-8">
              <Link href="/dashboard" className="font-bold text-xl">
                🏓 Office Ping Pong
              </Link>
              <Link href="/dashboard/today" className="hover:text-blue-600">
                Hoy
              </Link>
              <Link href="/dashboard/ranking" className="hover:text-blue-600">
                Ranking
              </Link>
              <Link href="/dashboard/history" className="hover:text-blue-600">
                Historial
              </Link>
              <Link href="/dashboard/players" className="hover:text-blue-600">
                Jugadores
              </Link>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

**Página principal dashboard: `app/dashboard/page.tsx`**
```typescript
'use client';

import { PlayerSelector } from '@/components/players/player-selector';
import { useCurrentSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { session, loading } = useCurrentSession();
  const router = useRouter();

  if (loading) return <div>Cargando...</div>;

  if (session) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ya hay una sesión activa hoy</h1>
          <Button onClick={() => router.push('/dashboard/today')}>
            Ver partidos
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">{session.totalMatches}</div>
            <div className="text-gray-500">Total partidos</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">{session.completedMatches}</div>
            <div className="text-gray-500">Completados</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-orange-600">{session.pendingMatches}</div>
            <div className="text-gray-500">Pendientes</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Crear sesión de hoy</h1>
      <PlayerSelector />
    </div>
  );
}
```

**Página de partidos del día: `app/dashboard/today/page.tsx`**
```typescript
'use client';

import { MatchList } from '@/components/matches/match-list';

export default function TodayPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Partidos de hoy</h1>
      <MatchList />
    </div>
  );
}
```

**Página de ranking: `app/dashboard/ranking/page.tsx`**
```typescript
'use client';

import { Leaderboard } from '@/components/ranking/leaderboard';

export default function RankingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ranking</h1>
      <Leaderboard />
    </div>
  );
}
```

---

## 9. Componentes UI Detallados

### Tabs de navegación
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="pending">
  <TabsList>
    <TabsTrigger value="pending">Pendientes</TabsTrigger>
    <TabsTrigger value="completed">Completados</TabsTrigger>
  </TabsList>
  <TabsContent value="pending">
    {/* Lista de partidos pendientes */}
  </TabsContent>
  <TabsContent value="completed">
    {/* Lista de partidos completados */}
  </TabsContent>
</Tabs>
```

### Avatar con iniciales
```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function PlayerAvatar({ player }: { player: Player }) {
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar>
      <AvatarImage src={player.avatar} alt={player.name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
```

### Gráfico de evolución ELO
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function EloHistoryChart({ playerId }: { playerId: string }) {
  // Obtener historial de partidos del jugador
  const history = usePlayerMatchHistory(playerId);

  const data = history.map(match => ({
    date: format(match.playedAt, 'dd/MM'),
    elo: match.eloAfter
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="elo" stroke="#8884d8" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 10. Lógica de Negocio

### Funciones principales de Firestore

**Archivo: `lib/firebase/firestore.ts`**

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { calculateEloChange } from '../elo/calculator';
import { generateRoundRobin } from '../utils/round-robin';

// ========== PLAYERS ==========

export async function createPlayer(playerData: {
  name: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}) {
  const playersRef = collection(db, 'players');
  
  const initials = playerData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const newPlayer = {
    ...playerData,
    avatar: playerData.avatar || initials,
    eloRating: 1200,
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      highestElo: 1200,
      lowestElo: 1200,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(playersRef, newPlayer);
  return { id: docRef.id, ...newPlayer };
}

export async function getPlayerData(playerId: string) {
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);
  
  if (!playerSnap.exists()) {
    throw new Error('Jugador no encontrado');
  }
  
  return { id: playerSnap.id, ...playerSnap.data() };
}

export async function updatePlayerStats(
  playerId: string,
  matchResult: 'win' | 'loss',
  eloChange: number
) {
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);
  
  if (!playerSnap.exists()) {
    throw new Error('Jugador no encontrado');
  }
  
  const player = playerSnap.data();
  const newElo = player.eloRating + eloChange;
  const newTotalMatches = player.stats.totalMatches + 1;
  const newWins = matchResult === 'win' ? player.stats.wins + 1 : player.stats.wins;
  const newLosses = matchResult === 'loss' ? player.stats.losses + 1 : player.stats.losses;
  const newWinRate = newWins / newTotalMatches;
  
  // Actualizar racha
  let newStreak = player.stats.currentStreak;
  if (matchResult === 'win') {
    newStreak = newStreak >= 0 ? newStreak + 1 : 1;
  } else {
    newStreak = newStreak <= 0 ? newStreak - 1 : -1;
  }
  
  const updates = {
    eloRating: newElo,
    'stats.totalMatches': newTotalMatches,
    'stats.wins': newWins,
    'stats.losses': newLosses,
    'stats.winRate': newWinRate,
    'stats.highestElo': Math.max(player.stats.highestElo, newElo),
    'stats.lowestElo': Math.min(player.stats.lowestElo, newElo),
    'stats.currentStreak': newStreak,
    'stats.longestWinStreak': matchResult === 'win' 
      ? Math.max(player.stats.longestWinStreak, Math.abs(newStreak))
      : player.stats.longestWinStreak,
    'stats.longestLoseStreak': matchResult === 'loss'
      ? Math.max(player.stats.longestLoseStreak, Math.abs(newStreak))
      : player.stats.longestLoseStreak,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(playerRef, updates);
}

// ========== SESSIONS ==========

export async function createDailySession(selectedPlayerIds: string[]) {
  const today = new Date().toISOString().split('T')[0];
  const sessionRef = doc(db, 'sessions', today);
  
  // Verificar si ya existe
  const sessionSnap = await getDoc(sessionRef);
  if (sessionSnap.exists()) {
    throw new Error('Ya existe una sesión para hoy');
  }
  
  // Generar partidos
  const matchPairings = generateRoundRobin(selectedPlayerIds);
  
  // Crear sesión
  const session = {
    date: today,
    players: selectedPlayerIds,
    totalMatches: matchPairings.length,
    completedMatches: 0,
    pendingMatches: matchPairings.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(sessionRef, session);
  
  // Crear partidos
  const matchesRef = collection(db, `sessions/${today}/matches`);
  
  for (const pairing of matchPairings) {
    const player1Data = await getPlayerData(pairing.player1Id);
    const player2Data = await getPlayerData(pairing.player2Id);
    
    const match = {
      sessionDate: today,
      player1: {
        id: pairing.player1Id,
        name: player1Data.name,
        score: null,
        eloBefore: player1Data.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      player2: {
        id: pairing.player2Id,
        name: player2Data.name,
        score: null,
        eloBefore: player2Data.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      winnerId: null,
      status: 'pending',
      playedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(matchesRef, match);
  }
  
  return session;
}

// ========== MATCHES ==========

export async function recordMatchResult(
  sessionDate: string,
  matchId: string,
  result: {
    player1Score: number;
    player2Score: number;
    winnerId: string;
  }
) {
  const matchRef = doc(db, `sessions/${sessionDate}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);
  
  if (!matchSnap.exists()) {
    throw new Error('Partido no encontrado');
  }
  
  const match = matchSnap.data();
  
  // Determinar ganador y perdedor
  const isPlayer1Winner = result.winnerId === match.player1.id;
  const winnerData = isPlayer1Winner ? match.player1 : match.player2;
  const loserData = isPlayer1Winner ? match.player2 : match.player1;
  
  // Calcular cambios de ELO
  const eloResult = calculateEloChange({
    winnerElo: winnerData.eloBefore,
    loserElo: loserData.eloBefore,
    kFactor: 32
  });
  
  // Actualizar partido
  const updates = {
    'player1.score': result.player1Score,
    'player1.eloAfter': isPlayer1Winner ? eloResult.winnerNewElo : eloResult.loserNewElo,
    'player1.eloChange': isPlayer1Winner ? eloResult.winnerChange : eloResult.loserChange,
    'player2.score': result.player2Score,
    'player2.eloAfter': isPlayer1Winner ? eloResult.loserNewElo : eloResult.winnerNewElo,
    'player2.eloChange': isPlayer1Winner ? eloResult.loserChange : eloResult.winnerChange,
    winnerId: result.winnerId,
    status: 'completed',
    playedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(matchRef, updates);
  
  // Actualizar estadísticas de jugadores
  await updatePlayerStats(
    winnerData.id,
    'win',
    isPlayer1Winner ? eloResult.winnerChange : eloResult.winnerChange
  );
  
  await updatePlayerStats(
    loserData.id,
    'loss',
    isPlayer1Winner ? eloResult.loserChange : eloResult.loserChange
  );
  
  // Actualizar contador de sesión
  const sessionRef = doc(db, 'sessions', sessionDate);
  await updateDoc(sessionRef, {
    completedMatches: increment(1),
    pendingMatches: increment(-1),
    updatedAt: serverTimestamp()
  });
  
  // Guardar en historial global
  await addToMatchHistory({
    sessionDate,
    player1Id: match.player1.id,
    player1Name: match.player1.name,
    player1Score: result.player1Score,
    player1EloChange: updates['player1.eloChange'],
    player2Id: match.player2.id,
    player2Name: match.player2.name,
    player2Score: result.player2Score,
    player2EloChange: updates['player2.eloChange'],
    winnerId: result.winnerId,
    winnerName: isPlayer1Winner ? match.player1.name : match.player2.name,
  });
}

// ========== MATCH HISTORY ==========

async function addToMatchHistory(historyData: any) {
  const historyRef = collection(db, 'matchHistory');
  await addDoc(historyRef, {
    ...historyData,
    playedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

export async function getMatchHistory(limitNum: number = 50) {
  const historyRef = collection(db, 'matchHistory');
  const q = query(
    historyRef,
    orderBy('playedAt', 'desc'),
    limit(limitNum)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

---

## 11. Firebase Rules

**Firestore Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Config - Solo lectura
    match /config/{document=**} {
      allow read: if true;
      allow write: if false; // Solo admins por consola
    }
    
    // Players - Lectura pública, escritura limitada
    match /players/{playerId} {
      allow read: if true;
      allow create: if true; // Permitir crear jugadores
      allow update: if true; // Permitir actualizar stats
      allow delete: if false; // No permitir borrar
    }
    
    // Sessions - Lectura y escritura pública
    match /sessions/{sessionId} {
      allow read: if true;
      allow write: if true;
      
      // Matches subcollection
      match /matches/{matchId} {
        allow read: if true;
        allow write: if true;
      }
    }
    
    // Match History - Lectura pública, escritura limitada
    match /matchHistory/{historyId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false;
    }
  }
}
```

**Nota:** Estas reglas son muy permisivas porque la app usa una password compartida. En producción, considera implementar reglas más estrictas si es necesario.

---

## 12. Testing

### Tests Unitarios para Sistema ELO

```typescript
// lib/elo/__tests__/calculator.test.ts

import { calculateEloChange, predictMatchOutcome } from '../calculator';

describe('ELO Calculator', () => {
  test('jugador débil vence a jugador fuerte', () => {
    const result = calculateEloChange({
      winnerElo: 1000,
      loserElo: 1400,
      kFactor: 32
    });
    
    expect(result.winnerChange).toBeGreaterThan(20);
    expect(result.loserChange).toBeLessThan(-20);
    expect(result.winnerNewElo).toBe(1000 + result.winnerChange);
  });
  
  test('jugador fuerte vence a jugador débil', () => {
    const result = calculateEloChange({
      winnerElo: 1400,
      loserElo: 1000,
      kFactor: 32
    });
    
    expect(result.winnerChange).toBeLessThan(10);
    expect(result.loserChange).toBeGreaterThan(-10);
  });
  
  test('jugadores de nivel similar', () => {
    const result = calculateEloChange({
      winnerElo: 1200,
      loserElo: 1220,
      kFactor: 32
    });
    
    expect(Math.abs(result.winnerChange)).toBeGreaterThan(10);
    expect(Math.abs(result.winnerChange)).toBeLessThan(20);
  });
  
  test('predicción de resultado', () => {
    const prediction = predictMatchOutcome(1400, 1000);
    
    expect(prediction.player1WinProbability).toBeGreaterThan(0.9);
    expect(prediction.player2WinProbability).toBeLessThan(0.1);
    expect(prediction.player1WinProbability + prediction.player2WinProbability).toBeCloseTo(1);
  });
});
```

### Tests de Integración

```typescript
// __tests__/integration/match-flow.test.ts

import { createDailySession, recordMatchResult } from '@/lib/firebase/firestore';

describe('Flujo completo de partido', () => {
  test('crear sesión y registrar resultado', async () => {
    // Crear jugadores de prueba
    const player1 = await createPlayer({ name: 'Test Player 1' });
    const player2 = await createPlayer({ name: 'Test Player 2' });
    
    // Crear sesión
    const session = await createDailySession([player1.id, player2.id]);
    expect(session.totalMatches).toBe(1);
    
    // Obtener el partido
    const matches = await getTodayMatches();
    const match = matches[0];
    
    // Registrar resultado
    await recordMatchResult(session.date, match.id, {
      player1Score: 11,
      player2Score: 7,
      winnerId: player1.id
    });
    
    // Verificar actualización de stats
    const updatedPlayer1 = await getPlayerData(player1.id);
    expect(updatedPlayer1.stats.wins).toBe(1);
    expect(updatedPlayer1.eloRating).toBeGreaterThan(1200);
  });
});
```

---

## 13. Deployment

> **🎯 Arquitectura Recomendada**: Vercel (Frontend) + Firebase (Database)
>
> Esta combinación aprovecha lo mejor de ambos servicios: Vercel para hosting Next.js optimizado y Firebase para la base de datos en tiempo real.

### Arquitectura de Deployment

```
┌─────────────────────────────────────────┐
│          User's Device (PWA)            │
└─────────────────────────────────────────┘
            │                    │
            │ HTTPS             │ Firebase SDK
            ▼                    ▼
┌──────────────────┐   ┌──────────────────┐
│  Vercel CDN      │   │  Firebase        │
│  - Next.js App   │   │  - Firestore DB  │
│  - Static Assets │   │  - Auth Config   │
│  - API Routes    │   │  - Offline Cache │
│  - Edge Network  │   │                  │
└──────────────────┘   └──────────────────┘
```

### Deployment en Vercel (Recomendado)

**Ventajas de Vercel:**
- ✅ Creado por el equipo de Next.js (mejor integración)
- ✅ Despliegue automático desde GitHub
- ✅ Preview deployments por cada PR
- ✅ CDN global automático
- ✅ HTTPS automático
- ✅ Mejor rendimiento para Next.js
- ✅ Variables de entorno fáciles de configurar

**Paso 1: Preparar Firebase**

Crea un proyecto Firebase y obtén las credenciales:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea nuevo proyecto: "office-ping-pong"
3. Activa Firestore Database
4. En Project Settings > General, copia las credenciales web
5. Configura Firebase Rules (ver sección 11)

**Paso 2: Configurar Variables de Entorno**

Crea `.env.local` en tu proyecto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

**Paso 3: Deploy a Vercel**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy (production)
vercel --prod
```

**O usar Vercel Dashboard:**
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa tu repositorio
4. Configura las variables de entorno (copia de `.env.local`)
5. Deploy automático!

**Paso 4: Configurar Dominio (Opcional)**

En Vercel Dashboard:
1. Ve a tu proyecto > Settings > Domains
2. Agrega tu dominio personalizado
3. Configura DNS según instrucciones
4. HTTPS automático con Let's Encrypt

### Firebase Setup (Solo Base de Datos)

**Lo que USAMOS de Firebase:**
- ✅ Firestore Database
- ✅ Firebase Auth SDK (solo para validar password)
- ✅ Offline persistence

**Lo que NO USAMOS:**
- ❌ Firebase Hosting (Vercel lo reemplaza)
- ❌ Cloud Functions (no necesarias)
- ❌ Firebase Authentication completo (solo password compartida)

**Configuración Firebase:**

```bash
# Instalar Firebase CLI (solo para configurar)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (solo Firestore)
firebase init firestore

# Seleccionar:
# - Firestore: Rules y indices
# - NO seleccionar Hosting, Functions, etc.
```

**Desplegar Firestore Rules:**

```bash
firebase deploy --only firestore:rules
```

### PWA Deployment Checklist

Antes de desplegar a producción, verifica:

- [ ] `manifest.json` configurado correctamente
- [ ] Todos los iconos PWA generados (72px - 512px)
- [ ] Service worker funciona en local (`npm run build && npm start`)
- [ ] Firebase offline persistence habilitada
- [ ] Variables de entorno configuradas en Vercel
- [ ] HTTPS habilitado (automático en Vercel)
- [ ] Lighthouse PWA score ≥ 90
- [ ] Probado en iOS Safari y Android Chrome
- [ ] Install prompt funciona correctamente

### Monitoreo y Analytics (Opcional)

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Firebase Analytics:**
```typescript
import { getAnalytics } from 'firebase/analytics';

if (typeof window !== 'undefined') {
  const analytics = getAnalytics(app);
}
```

### Rollback y Versioning

**Vercel Rollback:**
- En Dashboard > Deployments
- Click en deployment anterior
- "Promote to Production"
- Rollback instantáneo!

**Git-based Workflow:**
```bash
# Cada push a main → Deploy automático
git push origin main

# Preview deployments para branches
git checkout -b feature/nueva-funcionalidad
git push origin feature/nueva-funcionalidad
# Vercel crea preview URL automáticamente
```

---

## Mejoras Futuras (Optional)

### Features adicionales que podrías implementar:

1. **Sistema de torneos**
   - Crear torneos con brackets
   - Seguimiento de progreso
   - Premios o badges

2. **Estadísticas avanzadas**
   - Head-to-head entre jugadores
   - Mapa de calor de horarios de juego
   - Predicción de resultados con IA

3. **Notificaciones**
   - Push notifications para recordar partidos
   - Email diario con resumen

4. **Perfiles de jugador extendidos**
   - Foto de perfil personalizada
   - Bio o frase característica
   - Títulos o logros desbloqueables

5. **Sistema de apuestas ficticias**
   - Moneda virtual para apostar
   - Leaderboard de mejores apostadores

6. **Modo equipos**
   - Partidos 2v2
   - Rankings de equipos

7. **Análisis con IA**
   - Consejos personalizados
   - Análisis de patrones de juego
   - Sugerencias de entrenamientos

8. **Exportación de datos**
   - PDF de estadísticas
   - CSV de historial
   - Compartir en redes sociales

9. **Modo offline**
   - PWA con soporte offline
   - Sincronización cuando vuelva conexión

10. **Integración con Slack**
    - Notificar resultados en canal
    - Comandos para ver rankings

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format con Prettier
npx prettier --write .

# Agregar componente Shadcn
npx shadcn@latest add [component-name]

# Ver logs de Firebase
firebase functions:log

# Emuladores locales de Firebase
firebase emulators:start
```

---

## Recursos y Referencias

### Documentación Oficial
- **Next.js**: https://nextjs.org/docs
- **Shadcn/ui**: https://ui.shadcn.com/
- **Firebase**: https://firebase.google.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hook Form**: https://react-hook-form.com/
- **Recharts**: https://recharts.org/

### Tutoriales Recomendados
- Next.js 14 App Router: https://nextjs.org/learn
- Firebase Firestore: https://firebase.google.com/docs/firestore
- ELO Rating System: https://en.wikipedia.org/wiki/Elo_rating_system

### Comunidades
- Next.js Discord: https://discord.gg/nextjs
- Firebase Discord: https://discord.gg/firebase

---

## Troubleshooting

### Problemas Comunes

**1. Error de autenticación con Firebase**
```
Solución: Verificar que las variables de entorno estén correctamente configuradas en .env.local
```

**2. Componentes de Shadcn no se renderizan**
```
Solución: Asegurarse de que Tailwind está configurado correctamente y que los paths en tailwind.config.ts incluyen ./components
```

**3. Hydration errors en Next.js**
```
Solución: Asegurarse de que no estás usando localStorage o window en el render inicial. Usa useEffect para operaciones del lado del cliente.
```

**4. Build falla en Vercel**
```
Solución: Verificar que todas las dependencias están en package.json y que TypeScript no tiene errores
```

---

## Conclusión

Este documento proporciona una guía completa para implementar la aplicación de ping-pong de oficina. El proyecto utiliza tecnologías modernas y está diseñado para ser escalable y fácil de mantener.

La combinación de Next.js + Shadcn/ui + Firebase proporciona:
- ✅ Desarrollo rápido
- ✅ UI profesional
- ✅ Backend serverless
- ✅ Tiempo real
- ✅ Escalabilidad automática

**Próximos pasos:**
1. Seguir la guía paso a paso
2. Implementar las funcionalidades core
3. Testear con usuarios reales
4. Iterar basándose en feedback
5. Agregar features adicionales

¡Buena suerte con el desarrollo! 🏓
