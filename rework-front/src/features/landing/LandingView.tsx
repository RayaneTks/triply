import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import { motion } from "motion/react";

export function LandingView() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative px-6 pt-12 lg:pt-32 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-display font-bold text-light-foreground leading-tight mb-8"
          >
            Planifiez votre voyage <br/>
            <span className="text-brand">idéal</span> en 10 minutes.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-light-muted mb-12 max-w-xl"
          >
            Triply est votre copilote intelligent qui transforme vos envies en itinéraire concret, optimisé pour votre budget.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/planifier" className="btn-primary flex items-center justify-center gap-2 group">
              Commencer le cadrage
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/voyages" className="btn-secondary flex items-center justify-center">
              Retrouver mes brouillons
            </Link>
          </motion.div>

          <div className="mt-12 flex flex-wrap gap-8">
            {["Budget maîtrisé", "Assistant IA 24/7", "Zéro fragmentation"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-bold text-light-muted">
                <Check size={16} className="text-brand" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image Mock / Placeholder */}
        <div className="mt-20 lg:absolute lg:top-20 lg:right-0 lg:w-1/3 aspect-[4/5] bg-slate-200 rounded-3xl overflow-hidden shadow-2xl rotate-2 hidden lg:block">
           <div className="w-full h-full bg-linear-to-br from-brand/20 to-brand/5 flex items-center justify-center p-12 text-center">
              <p className="text-brand/40 font-display text-4xl">Visualisez votre prochaine aventure.</p>
           </div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="bg-white py-24 border-y border-light-border px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-16">Ce que Triply retient pour vous</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Vos contraintes de vol", desc: "Plus besoin de copier-coller vos horaires." },
              { title: "Vos envies locales", desc: "Des activités qui collent à votre profil." },
              { title: "Votre enveloppe réelle", desc: "Chaque euro est budgété avant le départ." }
            ].map((card, i) => (
              <div key={i} className="p-8 triply-card">
                <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                <p className="text-light-muted leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 text-center">
        <h2 className="text-4xl font-display font-bold mb-8">Prêt à décoller ?</h2>
        <Link to="/planifier" className="btn-primary inline-flex">
          Lancer mon premier projet
        </Link>
        <div className="mt-6">
          <Link to="/tarifs" className="text-light-muted font-bold hover:text-brand transition-colors">
            Voir les tarifs
          </Link>
        </div>
      </section>
    </div>
  );
}
