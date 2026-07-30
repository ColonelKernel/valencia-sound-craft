import { useMemo } from "react";
import { m } from "framer-motion";
import type { ArtistMonthly } from "@/lib/musicDataService";
import { buildArtistComparison, diversificationScore, formatMetric, volatilityScore } from "@/lib/catalogAnalytics";
import { forecast } from "@/lib/linearRegression";

interface Props {
  data: ArtistMonthly[];
  portfolio: string[];
  onRemove: (artist: string) => void;
  mode: "streams" | "revenue";
}

export default function PortfolioBuilder({ data, portfolio, onRemove, mode }: Props) {
  const comparisons = useMemo(
    () => buildArtistComparison(data, portfolio),
    [data, portfolio]
  );

  const totalStreams = useMemo(
    () => comparisons.reduce((s, c) => s + c.total, 0),
    [comparisons]
  );

  const divScore = useMemo(() => {
    const vols = comparisons.map((c) => c.volatility / 100);
    return diversificationScore(vols);
  }, [comparisons]);

  const portfolioForecast = useMemo(() => {
    // Aggregate all portfolio monthly data then forecast
    const monthMap = new Map<string, number>();
    comparisons.forEach((c) => {
      c.monthlyData.forEach((m) => {
        monthMap.set(m.month, (monthMap.get(m.month) ?? 0) + m.streams);
      });
    });
    const sorted = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, s], i) => ({ x: i, y: s }));
    const fc = forecast(sorted, 6);
    return fc.reduce((s, f) => s + f.y, 0);
  }, [comparisons]);

  if (!portfolio.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Portfolio Builder</h3>
        <p className="text-sm text-muted-foreground">
          Add artists to your portfolio to see aggregated metrics, diversification scoring, and combined forecasts.
        </p>
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground">Portfolio Summary</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {portfolio.length} artist{portfolio.length > 1 ? "s" : ""} in portfolio
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Total {mode === "revenue" ? "Revenue" : "Streams"}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {formatMetric(totalStreams, mode)}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Diversification</p>
          <p className={`text-2xl md:text-3xl font-bold ${
            divScore >= 70 ? "text-emerald-400" :
            divScore >= 40 ? "text-amber-400" : "text-red-400"
          }`}>
            {divScore}/100
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${divScore}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                divScore >= 70 ? "bg-emerald-400" :
                divScore >= 40 ? "bg-amber-400" : "bg-red-400"
              }`}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            6-Month Forecast
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {formatMetric(portfolioForecast, mode)}
          </p>
        </div>
      </div>

      {/* Portfolio artists list */}
      <div className="rounded-xl border border-border/50 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Artist</th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {mode === "revenue" ? "Revenue" : "Streams"}
              </th>
              <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Weight</th>
              <th className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Risk</th>
              <th className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => (
              <tr key={c.artist} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="p-3 font-medium text-foreground">{c.artist}</td>
                <td className="p-3 text-right text-muted-foreground">{formatMetric(c.total, mode)}</td>
                <td className="p-3 text-right text-muted-foreground">
                  {totalStreams > 0 ? `${((c.total / totalStreams) * 100).toFixed(0)}%` : "–"}
                </td>
                <td className="p-3 text-center">
                  <span className={
                    c.volatilityLabel === "Low" ? "text-emerald-400" :
                    c.volatilityLabel === "High" ? "text-red-400" : "text-amber-400"
                  }>
                    {c.volatilityLabel}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onRemove(c.artist)}
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </m.div>
  );
}
