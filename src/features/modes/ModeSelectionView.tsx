import React from "react";
import { Link } from "react-router-dom";
import { Compass, Edit3 } from "lucide-react";
import { motion } from "motion/react";

export function ModeSelectionView() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-display font-bold text-center mb-4">Comment souhaitez-vous planifier ?</h1>
      <p className="text-light-muted text-center mb-16 text-lg">Choisissez l'approche qui vous convient le mieux.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div whileHover={{ y: -5 }}>
          <Link 
            to="/planifier/wizard"
            className="flex flex-col p-8 triply-card border-2 border-transparent hover:border-brand/30 h-full group"
          >
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Compass size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Parcours guidé</h2>
            <p className="text-light-muted leading-relaxed mb-8">
              Laissez-vous porter par notre assistant. Répondez à quelques questions et obtenez un itinéraire complet optimisé.
            </p>
            <span className="mt-auto text-brand font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
              Choisir ce mode <Edit3 size={16} />
            </span>
          </Link>
        </motion.div>

        <motion.div whileHover={{ y: -5 }}>
          <Link 
            to="/planifier/manuel"
            className="flex flex-col p-8 triply-card border-2 border-transparent hover:border-brand/30 h-full group"
          >
            <div className="w-16 h-16 bg-light-bg text-light-muted rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Edit3 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Mode manuel</h2>
            <p className="text-light-muted leading-relaxed mb-8">
              Pour ceux qui savent déjà ce qu'ils veulent. Décrivez votre projet en quelques lignes ou saisissez vos étapes librement.
            </p>
            <span className="mt-auto text-light-muted font-bold flex items-center gap-2 group-hover:gap-3 transition-all group-hover:text-brand">
              Édition libre
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
