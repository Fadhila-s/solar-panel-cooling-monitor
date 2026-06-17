import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Droplets,
  Fan,
  Gauge,
  Sun,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SolarCool — Dashboard Monitoring Pendingin Panel Surya" },
      {
        name: "description",
        content:
          "Pantau performa sistem pendingin panel surya secara real-time: suhu, aliran air, kelembapan, dan efisiensi daya.",
      },
    ],
  }),
  component: Dashboard,
});

type Point = { t: string; tempIn: number; tempOut: number; power: number; flow: number };

const MAX_POINTS = 30;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function seedHistory(): Point[] {
  const now = Date.now();
  return Array.from({ length: MAX_POINTS }, (_, i) => {
    const d = new Date(now - (MAX_POINTS - i) * 2000);
    return {
      t: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      tempIn: +rand(58, 68).toFixed(1),
      tempOut: +rand(38, 46).toFixed(1),
      power: +rand(420, 510).toFixed(0),
      flow: +rand(2.4, 3.2).toFixed(2),
    };
  });
}

function Dashboard() {
  const [history, setHistory] = useState<Point[]>(() => seedHistory());
  const [pumpOn, setPumpOn] = useState(true);
  const [fanSpeed, setFanSpeed] = useState(72);

  useEffect(() => {
    const id = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const next: Point = {
          t: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          tempIn: +Math.max(50, Math.min(72, last.tempIn + rand(-1.2, 1.2))).toFixed(1),
          tempOut: +Math.max(34, Math.min(50, last.tempOut + rand(-0.8, 0.8))).toFixed(1),
          power: +Math.max(380, Math.min(540, last.power + rand(-12, 12))).toFixed(0),
          flow: +Math.max(2, Math.min(3.5, last.flow + rand(-0.15, 0.15))).toFixed(2),
        };
        return [...prev.slice(-MAX_POINTS + 1), next];
      });
      setFanSpeed((s) => Math.max(40, Math.min(95, s + rand(-3, 3))));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const current = history[history.length - 1];
  const prev = history[history.length - 2] ?? current;
  const delta = +(current.tempIn - current.tempOut).toFixed(1);
  const efficiency = Math.max(0, Math.min(100, 60 + delta * 1.6)).toFixed(0);

  const panels = [
    { id: "A-01", temp: current.tempOut + rand(-1, 1), power: current.power / 4 + rand(-8, 8), status: "ok" },
    { id: "A-02", temp: current.tempOut + rand(-1, 2), power: current.power / 4 + rand(-8, 8), status: "ok" },
    { id: "B-01", temp: current.tempOut + rand(0, 3), power: current.power / 4 + rand(-12, 4), status: "warn" },
    { id: "B-02", temp: current.tempOut + rand(-1, 1), power: current.power / 4 + rand(-8, 8), status: "ok" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Sun className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">SolarCool Monitor</h1>
              <p className="text-sm text-muted-foreground">
                Dashboard Pendingin Panel Surya · Real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium">LIVE</span>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Update terakhir</div>
              <div className="font-mono text-foreground">{current.t}</div>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Thermometer className="h-5 w-5" />}
            label="Suhu Panel"
            value={`${current.tempIn.toFixed(1)}°C`}
            sub={`Δ ${(current.tempIn - prev.tempIn).toFixed(1)}°C`}
            trend={current.tempIn > prev.tempIn ? "up" : "down"}
            tone="warm"
          />
          <KpiCard
            icon={<Droplets className="h-5 w-5" />}
            label="Suhu Pendingin"
            value={`${current.tempOut.toFixed(1)}°C`}
            sub={`Selisih ${delta}°C`}
            trend="down"
            tone="cool"
          />
          <KpiCard
            icon={<Zap className="h-5 w-5" />}
            label="Daya Output"
            value={`${current.power} W`}
            sub={`${current.power > prev.power ? "+" : ""}${(current.power - prev.power).toFixed(0)} W`}
            trend={current.power > prev.power ? "up" : "down"}
            tone="energy"
          />
          <KpiCard
            icon={<Gauge className="h-5 w-5" />}
            label="Efisiensi Pendingin"
            value={`${efficiency}%`}
            sub={`Aliran ${current.flow} L/min`}
            trend="up"
            tone="mint"
          />
        </section>

        {/* Charts */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Suhu Panel vs Pendingin</h2>
                <p className="text-xs text-muted-foreground">2 detik per sampel · 60 detik terakhir</p>
              </div>
              <Legend />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.17 75)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.82 0.17 75)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.32 0.035 245)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "oklch(0.7 0.03 240)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={32} />
                  <YAxis tick={{ fill: "oklch(0.7 0.03 240)", fontSize: 11 }} tickLine={false} axisLine={false} domain={[30, 75]} unit="°" />
                  <Tooltip content={<CustomTip />} />
                  <Area type="monotone" dataKey="tempIn" stroke="oklch(0.82 0.17 75)" strokeWidth={2} fill="url(#gIn)" />
                  <Area type="monotone" dataKey="tempOut" stroke="oklch(0.72 0.15 200)" strokeWidth={2} fill="url(#gOut)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Daya Output</h2>
              <p className="text-xs text-muted-foreground">Watt</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.32 0.035 245)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "oklch(0.7 0.03 240)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={40} />
                  <YAxis tick={{ fill: "oklch(0.7 0.03 240)", fontSize: 11 }} tickLine={false} axisLine={false} domain={[360, 560]} />
                  <Tooltip content={<CustomTip unit=" W" />} />
                  <Line type="monotone" dataKey="power" stroke="oklch(0.7 0.18 145)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Controls + Panel Grid */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold">Kendali Sistem</h2>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary">
                    <Droplets className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Pompa Pendingin</div>
                    <div className="text-xs text-muted-foreground">{pumpOn ? "Aktif" : "Mati"}</div>
                  </div>
                </div>
                <button
                  onClick={() => setPumpOn((p) => !p)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    pumpOn ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                      pumpOn ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary">
                      <Fan className="h-4 w-4 text-accent animate-spin" style={{ animationDuration: `${4 - fanSpeed / 40}s` }} />
                    </div>
                    <div className="text-sm font-medium">Kipas Heatsink</div>
                  </div>
                  <span className="font-mono text-sm">{fanSpeed.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all"
                    style={{ width: `${fanSpeed}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Status Sistem
                </div>
                <div className="mt-2 text-sm">
                  Sistem berjalan <span className="text-emerald-400">normal</span>. Penurunan suhu{" "}
                  <span className="font-medium text-primary">{delta}°C</span> mempertahankan efisiensi panel.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Status Per Panel</h2>
              <span className="text-xs text-muted-foreground">4 panel terpasang</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {panels.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-4"
                >
                  <div>
                    <div className="text-xs text-muted-foreground">Panel</div>
                    <div className="text-lg font-semibold">{p.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{p.temp.toFixed(1)}°C</div>
                    <div className="font-mono text-xs text-muted-foreground">{p.power.toFixed(0)} W</div>
                  </div>
                  <span
                    className={`ml-3 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      p.status === "ok"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {p.status === "ok" ? "Optimal" : "Awas"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  trend,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down";
  tone: "warm" | "cool" | "energy" | "mint";
}) {
  const tones: Record<string, string> = {
    warm: "from-primary/20 to-transparent text-primary",
    cool: "from-accent/20 to-transparent text-accent",
    energy: "from-emerald-500/20 to-transparent text-emerald-400",
    mint: "from-violet-500/20 to-transparent text-violet-300",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className={`absolute inset-0 bg-gradient-to-br ${tones[tone]} opacity-60`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`grid h-9 w-9 place-items-center rounded-lg bg-secondary ${tones[tone].split(" ").pop()}`}>
            {icon}
          </div>
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-400" />
          )}
        </div>
        <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary" /> Panel
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent" /> Pendingin
      </span>
    </div>
  );
}

function CustomTip({ active, payload, label, unit = "°C" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-mono text-muted-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.stroke }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="ml-auto font-mono">
            {p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
