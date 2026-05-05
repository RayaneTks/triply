import React from "react";
import { Link } from "react-router-dom";
import { TriplyLogo } from "../../components/layout/TriplyLogo";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-light-border px-6 py-12 lg:py-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <TriplyLogo />
          <p className="text-light-muted text-sm leading-relaxed max-w-xs">
            Le copilote intelligent qui réduit votre charge mentale et respecte votre budget pour vos aventures en Europe.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-light-foreground mb-6">Produit</h4>
          <ul className="space-y-4">
            <li><Link to="/planifier" className="text-light-muted text-sm hover:text-brand transition-colors">Planifier</Link></li>
            <li><Link to="/tarifs" className="text-light-muted text-sm hover:text-brand transition-colors">Tarifs</Link></li>
            <li><Link to="/a-propos" className="text-light-muted text-sm hover:text-brand transition-colors">À propos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-light-foreground mb-6">Légal</h4>
          <ul className="space-y-4">
            <li><Link to="/legal/cgu" className="text-light-muted text-sm hover:text-brand transition-colors">CGU</Link></li>
            <li><Link to="/legal/confidentialite" className="text-light-muted text-sm hover:text-brand transition-colors">Confidentialité</Link></li>
            <li><Link to="/legal/mentions" className="text-light-muted text-sm hover:text-brand transition-colors">Mentions légales</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-light-foreground mb-6">Communauté</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-light-muted text-sm hover:text-brand transition-colors">Instagram</a></li>
            <li><a href="#" className="text-light-muted text-sm hover:text-brand transition-colors">Twitter / X</a></li>
            <li><a href="mailto:hello@triply.io" className="text-light-muted text-sm hover:text-brand transition-colors">Support</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-light-border flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-light-muted text-[10px] font-bold uppercase tracking-widest">
          © {currentYear} Triply. Fait avec passion pour les voyageurs curieux.
        </p>
      </div>
    </footer>
  );
}
