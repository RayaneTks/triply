import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home, Search } from "lucide-react";
import { motion } from "motion/react";

export function NotFoundView() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
       <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8"
       >
          <div className="relative">
            <span className="text-[150px] font-display font-bold text-brand opacity-10">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
               <Compass size={80} className="text-brand animate-spin-slow" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-display font-bold">Zone de turbulences</h1>
            <p className="text-light-muted max-w-md mx-auto text-lg">
              La destination que vous cherchez n'existe pas ou a été déplacée par notre copilote pour une meilleure route.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
             <Link to="/" className="btn-primary flex items-center gap-2">
                <Home size={18} /> Retour à l'accueil
             </Link>
             <Link to="/planifier" className="btn-secondary flex items-center gap-2">
                <Search size={18} /> Planifier un voyage
             </Link>
          </div>
       </motion.div>
    </div>
  );
}
