'use client';

import React, { useState } from "react";
import { Check, Map, Sparkles, Plane, ListChecks, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import Link from "next/link";

export function PricingView() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billing: isAnnual ? 'annual' : 'monthly' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPlan(null);
    }
  }

  const tiers = [
    {
      id: null,
      name: "Découverte",
      price: 0,
      features: ["1 voyage actif", "Assistant de base", "Exports PDF"],
      cta: "Commencer gratuitement",
      highlight: false
    },
    {
      id: "voyageur",
      name: "Voyageur",
      price: isAnnual ? 9 : 12,
      features: ["3 voyages actifs", "Assistant contextuel", "Budget en temps réel", "Synchronisation calendrier"],
      cta: "Choisir Voyageur",
      highlight: true
    },
    {
      id: "pilote",
      name: "Pilote",
      price: isAnnual ? 19 : 24,
      features: ["Voyages illimités", "Assistant Pro", "Gestion de groupe", "Support prioritaire"],
      cta: "Passer en Pilote",
      highlight: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-display font-bold mb-6">Un copilote pour chaque budget</h1>
        <p className="text-light-muted text-lg mb-12">Commencez gratuitement, évoluez selon vos aventures.</p>

        {/* Toggle Billing */}
        <div className="flex items-center justify-center gap-4">
          <span className={cn("text-sm font-bold", !isAnnual ? "text-brand" : "text-light-muted")}>Mensuel</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 bg-light-border rounded-full p-1 relative transition-colors"
          >
            <div className={cn(
              "w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
              isAnnual ? "translate-x-7" : "translate-x-0"
            )} />
          </button>
          <span className={cn("text-sm font-bold", isAnnual ? "text-brand" : "text-light-muted")}>
            Annuel <span className="text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-full ml-1">-20%</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-24">
        {tiers.map((tier) => (
          <div 
            key={tier.name}
            className={cn(
              "p-8 triply-card flex flex-col relative",
              tier.highlight && "ring-2 ring-brand border-brand shadow-xl"
            )}
          >
            {tier.highlight && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                Le plus populaire
              </span>
            )}
            <h2 className="text-xl font-bold mb-2">{tier.name}</h2>
            <div className="mb-8">
              <span className="text-4xl font-display font-bold">{tier.price}€</span>
              <span className="text-light-muted text-sm font-bold"> / mois</span>
            </div>
            
            <ul className="space-y-4 mb-12 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-medium">
                  <Check size={16} className="text-brand shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {tier.id ? (
              <button
                onClick={() => handleCheckout(tier.id!)}
                disabled={loadingPlan === tier.id}
                className={cn(
                  "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  tier.highlight ? "bg-brand text-white hover:bg-brand-hover" : "bg-light-bg text-light-foreground hover:bg-light-border",
                  loadingPlan === tier.id && "opacity-70 cursor-not-allowed"
                )}
              >
                {loadingPlan === tier.id && <Loader2 size={16} className="animate-spin" />}
                {tier.cta}
              </button>
            ) : (
              <Link href="/planifier" className={cn(
                "w-full py-4 rounded-xl font-bold transition-all text-center block",
                "bg-light-bg text-light-foreground hover:bg-light-border"
              )}>
                {tier.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-16 border-t border-light-border">
        {[
          { icon: Map, title: "Cartographie", desc: "Données précises" },
          { icon: Sparkles, title: "Accompagnement", desc: "Assistant dédié" },
          { icon: Plane, title: "Logistique", desc: "Sync transports" },
          { icon: ListChecks, title: "Organisation", desc: "Checklists riches" }
        ].map((f, i) => (
          <div key={i} className="text-center space-y-3">
            <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl mx-auto flex items-center justify-center">
              <f.icon size={24} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">{f.title}</h3>
            <p className="text-xs text-light-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
