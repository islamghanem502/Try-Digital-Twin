import { Activity, Heart, AlertTriangle, TrendingUp, Shield, Brain, MessageCircle } from "lucide-react";
import { useState } from "react";

interface HealthCardsProps {
  simulationMode: boolean;
  simData: SimulationData | null;
}

export interface SimulationData {
  bmi: number;
  bmiLabel: string;
  healthScore: number;
  healthLabel: string;
  diabetesRisk: number;
  cardiovascularRisk: number;
  kidneyPrediction: string;
  timeframe: string;
}

const DEFAULT_DATA: SimulationData = {
  bmi: 29.3,
  bmiLabel: "Overweight",
  healthScore: 57,
  healthLabel: "Fair",
  diabetesRisk: 80,
  cardiovascularRisk: 60,
  kidneyPrediction: "Kidney failure",
  timeframe: "5-10 years",
};

const HealthCards = ({ simulationMode, simData }: HealthCardsProps) => {
  const data = simData || DEFAULT_DATA;
  const isImproved = (field: keyof SimulationData) =>
    simulationMode && simData && typeof simData[field] === "number" && typeof DEFAULT_DATA[field] === "number"
      ? (simData[field] as number) < (DEFAULT_DATA[field] as number)
      : false;
  const isWorsened = (field: keyof SimulationData) =>
    simulationMode && simData && typeof simData[field] === "number" && typeof DEFAULT_DATA[field] === "number"
      ? (simData[field] as number) > (DEFAULT_DATA[field] as number)
      : false;

  const simClass = (field: keyof SimulationData) =>
    isImproved(field) ? "sim-improved" : isWorsened(field) ? "sim-worsened" : "";

  return (
    <div className="flex flex-col gap-3">
      {/* Vital Status - BMI */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0">
            <Activity size={18} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Vital Status</p>
            <p className={`text-3xl font-light text-foreground leading-none mt-1.5 ${simClass("bmi")}`}>
              {data.bmi}<span className="text-[13px] font-normal text-muted-foreground ml-1">BMI</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex">
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
            data.bmiLabel === "Overweight" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
          }`}>
            {data.bmiLabel}
          </span>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0">
              <Shield size={18} className="text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Health Score</p>
              <p className={`text-3xl font-light text-foreground leading-none mt-1.5 ${simClass("healthScore")}`}>
                {data.healthScore}<span className="text-[13px] font-normal text-muted-foreground ml-1 capitalize">{data.healthLabel}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 w-full relative">
          <div className="w-full h-8 bg-gradient-to-r from-blue-500/80 to-blue-50/30 rounded-md"></div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-muted-foreground">0</span>
            <span className="text-[11px] text-muted-foreground">100%</span>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Risk Assessment</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground font-medium">Diabetes Risk</span>
              <span className={`font-semibold ${simClass("diabetesRisk")}`}>{data.diabetesRisk}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-red-400 transition-all duration-700"
                style={{ width: `${data.diabetesRisk}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground font-medium">Cardiovascular Risk</span>
              <span className={`font-semibold ${simClass("cardiovascularRisk")}`}>{data.cardiovascularRisk}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-400 transition-all duration-700"
                style={{ width: `${data.cardiovascularRisk}%` }}
              />
            </div>
          </div>
        </div>
      </div>



      {/* Predictions */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0">
            <Brain size={18} className="text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-none">AI Predictions</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <span className="text-[12px] text-muted-foreground font-medium">Condition</span>
            <span className="text-[12px] font-medium text-red-500">{data.kidneyPrediction}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <span className="text-[12px] text-muted-foreground font-medium">Timeframe</span>
            <span className="text-[12px] font-medium text-foreground">{data.timeframe}</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[12px] text-muted-foreground font-medium">Confidence</span>
            <span className="text-[12px] font-medium text-orange-500">73%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCards;
