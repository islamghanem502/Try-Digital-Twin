import { useState, useCallback } from "react";
import { Heart, Brain, Wind, Droplets, FlaskConical, Activity } from "lucide-react";
import Header from "@/components/Header";
import DigitalTwin from "@/components/DigitalTwin";
import OrganNavBar from "@/components/OrganNavBar";
import HealthCards, { SimulationData } from "@/components/HealthCards";
import ChatInput from "@/components/ChatInput";

const FloatingTag = ({ organ }: { organ: string }) => {
  const organData: Record<string, { title: string; subtitle: string; value: string; unit: string; icon: any; iconColor: string }> = {
    heart: { title: "Heart Rate", subtitle: "Monitoring", value: "108", unit: "Bpm", icon: Heart, iconColor: "text-red-500" },
    brain: { title: "Brain Activity", subtitle: "O₂ Levels", value: "92", unit: "%", icon: Brain, iconColor: "text-purple-500" },
    lung: { title: "Respiratory", subtitle: "Rate", value: "15", unit: "br/min", icon: Wind, iconColor: "text-sky-500" },
    kidneys: { title: "Blood Glucose", subtitle: "Levels", value: "89", unit: "mmol/L", icon: Droplets, iconColor: "text-blue-500" },
    liver: { title: "Liver Enzymes", subtitle: "ALT Level", value: "52", unit: "IU/L", icon: FlaskConical, iconColor: "text-orange-500" },
    stomach: { title: "Digestive pH", subtitle: "Acidity", value: "2.1", unit: "pH", icon: Activity, iconColor: "text-green-500" },
    bladder: { title: "Hydration", subtitle: "Level", value: "65", unit: "%", icon: Droplets, iconColor: "text-blue-400" },
    intestinesLarge: { title: "Gut Health", subtitle: "Flora", value: "Optimal", unit: "", icon: Activity, iconColor: "text-green-500" },
    intestinesSmall: { title: "Absorption", subtitle: "Rate", value: "85", unit: "%", icon: Activity, iconColor: "text-teal-500" },
  };

  const info = organData[organ] || { title: organ, subtitle: "Status", value: "N/A", unit: "", icon: Activity, iconColor: "text-gray-500" };
  const Icon = info.icon;

  return (
    <div className="absolute top-6 left-6 z-10 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-left-4 duration-500 min-w-[240px]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
          <Icon size={24} className={info.iconColor} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-medium text-gray-900 leading-tight">{info.title}</span>
          <span className="text-[13px] text-gray-500 font-normal mt-0.5">{info.subtitle}</span>
        </div>
      </div>
      <div className="flex items-baseline">
        <span className="text-[42px] font-light text-gray-900 tracking-tight leading-none">{info.value}</span>
        <span className="text-[15px] text-gray-700 font-medium ml-1.5">{info.unit}</span>
      </div>
    </div>
  );
};

const Index = () => {
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simData, setSimData] = useState<SimulationData | null>(null);
  const [modelWeight, setModelWeight] = useState<number>(0.2);

  const handleSimulate = useCallback((prompt: string) => {
    if (!prompt) {
      setSimulationMode(false);
      setSimData(null);
      return;
    }

    setSimulationMode(true);
    // Simulated What-If results (static mock)
    const lower = prompt.toLowerCase();
    const isPositive = lower.includes("exercise") || lower.includes("lose") || lower.includes("diet") || lower.includes("healthy");
    const isNegative = lower.includes("gain") || lower.includes("eat") || lower.includes("sugar") || lower.includes("fat") || lower.includes("unhealthy");

    // Dynamic model weight adjustment based on prompt
    let newWeight = 0.2; 
    if (isPositive) newWeight = 0.0; // Fit/lose weight
    else if (isNegative) newWeight = 0.9; // Gain weight/fat
    
    setModelWeight(newWeight);

    setSimData({
      bmi: isPositive ? 24.5 : 31.2,
      bmiLabel: isPositive ? "Normal" : "Obese",
      healthScore: isPositive ? 78 : 42,
      healthLabel: isPositive ? "Good" : "Poor",
      diabetesRisk: isPositive ? 35 : 92,
      cardiovascularRisk: isPositive ? 25 : 78,
      kidneyPrediction: isPositive ? "Low risk" : "Kidney failure",
      timeframe: isPositive ? "N/A" : "3-5 years",
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-4 overflow-hidden min-h-0">
        {/* Left - Digital Twin */}
        <div className="lg:w-[45%] flex flex-col gap-0 min-h-0">
          {/* Greeting */}
          <div className="px-2 mb-3">
            <h1 className="text-2xl font-heading font-bold text-foreground">Hi, Islam!</h1>
            <p className="text-sm text-muted-foreground">Let's monitor your health!</p>
          </div>

          {/* 3D Model Container */}
          <div className="relative flex-1 rounded-3xl overflow-hidden min-h-0" style={{ background: '#f0f1f5' }}>
            {selectedOrgan && <FloatingTag organ={selectedOrgan} />}
            <DigitalTwin selectedOrgan={selectedOrgan} weight={modelWeight} />
          </div>

          {/* Organ Navigation */}
          <OrganNavBar selectedOrgan={selectedOrgan} onSelectOrgan={setSelectedOrgan} />
        </div>

        {/* Right - Dashboard */}
        <div className="lg:w-[55%] flex flex-col gap-3 min-h-0">
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">

            {/* Left column: Heart Rate + Blood Status + Chat fills rest */}
            <div className="flex flex-col gap-3 min-h-0">
              {/* Heart Rate Card */}
              <div className="bg-card rounded-2xl p-5 shadow-card shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0">
                    <Activity size={18} className="text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Heart Rate</p>
                    <p className="text-3xl font-light text-foreground leading-none mt-1.5">108<span className="text-[13px] font-normal text-muted-foreground ml-1">/Bmp</span></p>
                  </div>
                </div>
                <div className="h-12 mt-5 relative w-full flex items-center">
                  <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-full h-full">
                    <polyline points="0,20 15,20 25,5 35,35 45,20 60,20" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinejoin="round"/>
                    <polyline points="60,20 70,20 80,0 90,40 100,20 110,20 115,10 125,30 135,20" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round"/>
                    <polyline points="135,20 150,20 160,5 170,35 180,20 200,20" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Blood Status Card */}
              <div className="bg-card rounded-2xl p-5 shadow-card shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0">
                      <Droplets size={18} className="text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Blood Status</p>
                      <p className="text-3xl font-light text-foreground leading-none mt-1.5">116<span className="text-[13px] font-normal text-muted-foreground ml-1">/70</span></p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-end justify-between h-12 mt-2 px-1 relative">
                  {[40, 70, 30, 80, 50, 90, 45, 60].map((h, i) => (
                    <div key={i} className="flex flex-col justify-end h-full w-[2px]">
                      <div className={`w-full rounded-sm ${i === 5 ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ height: `${h}%` }} />
                    </div>
                  ))}
                  <div className="absolute right-0 bottom-0 flex flex-col justify-end items-end h-full">
                     <span className="text-2xl font-light leading-none">116</span>
                     <span className="text-[10px] text-muted-foreground leading-none mt-1">/75</span>
                  </div>
                </div>
              </div>

              {/* Chat Input — fills the empty space */}
              <div className="flex-1 min-h-0">
                <ChatInput onSimulate={handleSimulate} isSimulating={simulationMode} />
              </div>
            </div>

            {/* Right column: HealthCards — scrollable only if needed */}
            <div className="overflow-y-auto min-h-0">
              <HealthCards simulationMode={simulationMode} simData={simData} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
