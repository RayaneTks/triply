import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export function OnboardingView() {
  const navigate = useNavigate();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  const environments = [
    { id: "plage", label: "🏖️ Plage & Soleil" },
    { id: "montagne", label: "🏔️ Montagne & Air pur" },
    { id: "ville", label: "🏙️ City Break & Culture" },
    { id: "nature", label: "🌲 Nature & Forêt" },
    { id: "campagne", label: "🌾 Campagne & Calme" },
    { id: "insolite", label: "🛖 Insolite & Aventure" },
  ];

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-display font-bold mb-6">Quelles ambiances préférez-vous ?</h1>
        <p className="text-light-muted mb-12 text-lg">Sélectionnez vos styles préférés pour personnaliser vos recommandations.</p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {environments.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => toggleStyle(id)}
              className={cn(
                "px-6 py-4 rounded-2xl font-bold transition-all border-2",
                selectedStyles.includes(id)
                  ? "bg-brand/10 border-brand text-brand"
                  : "bg-white border-light-border text-light-muted hover:border-brand/30"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button 
          onClick={() => navigate("/planifier/wizard")}
          disabled={selectedStyles.length === 0}
          className="btn-primary w-full disabled:opacity-50 disabled:grayscale transition-all"
        >
          Continuer vers le cadrage
        </button>
      </motion.div>
    </div>
  );
}
