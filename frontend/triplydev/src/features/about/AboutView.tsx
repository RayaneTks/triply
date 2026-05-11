import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, Map, Target, TrendingUp, Users, ChevronRight } from "lucide-react";

export function AboutView() {
  const roadmap = [
    { period: "Q3 2026", title: "Partage Collaboratif", desc: "Invitez vos amis à voter sur les étapes du voyage." },
    { period: "Q4 2026", title: "Booking Direct", desc: "Réservez vos vols et hôtels sans quitter l'interface." },
    { period: "2027", title: "Offline Cockpit", desc: "Accédez à votre itinéraire même en plein milieu des Alpes sans réseau." },
  ];

  return (
    <div className="flex flex-col">
      <section className="px-6 py-20 bg-white border-b border-light-border">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">Notre Mission</span>
          </motion.div>
          <h1 className="text-5xl lg:text-7xl font-display font-bold">Réduire la charge mentale, <br/><span className="text-brand">décupler le plaisir.</span></h1>
          <p className="text-xl text-light-muted leading-relaxed">
            Organiser un voyage ne devrait pas être un second métier. Triply est né d'une frustration : la fragmentation entre dix onglets, les budgets flous et l'indécision.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-12">
          <div className="space-y-4">
             <h2 className="text-3xl font-display font-bold">Pourquoi Triply ?</h2>
             <p className="text-light-muted">Nous croyons qu'un bon itinéraire est un équilibre fragile entre structure et spontanéité.</p>
          </div>
          
          <div className="space-y-8">
            {[
              { icon: Target, title: "Budget comme priorité", text: "On ne vous propose pas la lune si votre budget est à terre. L'arbitrage est honnête." },
              { icon: Sparkles, title: "Copilote, pas oracle", text: "Des suggestions basées sur votre rythme réel, pas des listes impersonnelles." },
              { icon: TrendingUp, title: "Optimisation de temps", text: "De l'idée initiale à la feuille de route prête en moins de 10 minutes." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 bg-brand/5 text-brand rounded-2xl flex items-center justify-center shrink-0">
                   <feature.icon size={24} />
                </div>
                <div>
                   <h3 className="font-bold mb-2">{feature.title}</h3>
                   <p className="text-sm text-light-muted leading-relaxed">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-light-bg rounded-[40px] aspect-square flex items-center justify-center p-12 overflow-hidden border border-light-border">
           <Map size={200} className="text-brand/10 rotate-12" />
        </div>
      </section>

      <section className="bg-dark-bg text-white py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <header className="text-center">
             <h2 className="text-3xl font-display font-bold mb-4 italic text-cyan-accent">Notre Roadmap</h2>
             <p className="text-dark-muted max-w-lg mx-auto uppercase text-[10px] font-bold tracking-widest">Le futur du voyage, itération par itération</p>
          </header>
          
          <div className="grid md:grid-cols-3 gap-8">
            {roadmap.map((item, i) => (
              <div key={i} className="triply-glass-panel p-8 space-y-4">
                <span className="text-cyan-accent font-mono text-xs">{item.period}</span>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm text-dark-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center space-y-8">
        <h2 className="text-4xl font-display font-bold">L'aventure commence ici.</h2>
        <Link to="/planifier" className="btn-primary inline-flex items-center gap-2">
          Démarrer mon premier projet
          <ChevronRight size={18} />
        </Link>
      </section>
    </div>
  );
}
