import React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";

export function TermsView() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 prose prose-slate prose-brand">
      <PageHeader 
        title="Conditions Générales d'Utilisation" 
        subtitle="Dernière mise à jour : 04 Mai 2026"
        className="not-prose"
      />
      
      <section>
        <h2>1. Objet</h2>
        <p>Les présentes CGU ont pour objet de définir les modalités de mise à disposition des services du site Triply, ci-après nommé « le Service » et les conditions d'utilisation du Service par l'Utilisateur.</p>
      </section>

      <section>
        <h2>2. Accès au service</h2>
        <p>Le Service est accessible gratuitement à tout Utilisateur disposant d'un accès à internet. Tous les coûts afférents à l'accès au Service, que ce soient les frais matériels, logiciels ou d'accès à internet sont exclusivement à la charge de l'Utilisateur.</p>
        <p>Certains services sont réservés aux Utilisateurs ayant créé un compte (ci-après « Utilisateurs Inscrits »). Triply se réserve le droit de restreindre l'accès à certaines fonctionnalités.</p>
      </section>

      <section>
        <h2>3. Données personnelles et traitements automatisés</h2>
        <p>Triply peut traiter certaines informations que vous saisissez (dont le mode libre / bref descriptif) pour structurer votre projet de voyage. Ces traitements sont décrits dans la politique de confidentialité.</p>
      </section>

      <section>
        <h2>4. Responsabilité</h2>
        <p>Les informations diffusées sur le site Triply (suggestions de restaurants, hôtels, activités) sont fournies à titre indicatif. La responsabilité de Triply ne peut être engagée en cas d'erreur ou d'omission. L'Utilisateur est seul responsable de ses réservations finales auprès de tiers.</p>
      </section>

      <div className="not-prose mt-20 pt-10 border-t border-light-border">
         <p className="text-light-muted text-sm">Une question ? <Link to="/a-propos" className="text-brand font-bold underline">Contactez-nous</Link></p>
      </div>
    </div>
  );
}

export function PrivacyView() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 prose prose-slate prose-brand">
      <PageHeader 
        title="Politique de Confidentialité" 
        subtitle="Comment nous protégeons vos données de voyage."
        className="not-prose"
      />
      <h2>Protection de vos données</h2>
      <p>Chez Triply, nous savons que vos projets de voyage sont personnels. Nous collectons uniquement les données nécessaires à l'optimisation de votre itinéraire : destination, budget, préférences de rythme.</p>
      <h3>Cookies</h3>
      <p>Nous utilisons des cookies pour maintenir votre session active et mémoriser votre mode de navigation préféré (Cockpit vs Standard).</p>
    </div>
  );
}

export function MentionsLegalesView() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 prose prose-slate prose-brand">
      <PageHeader 
        title="Mentions Légales" 
        subtitle="Transparence et informations administratives."
        className="not-prose"
      />
      <p>Le site Triply est édité par la société <strong>Triply SAS</strong>, au capital de 10 000€, immatriculée au RCS de Paris sous le numéro 123 456 789.</p>
      <p>Siège social : 12 rue du Voyage Durable, 75001 Paris.</p>
      <p>Directeur de la publication : Monsieur Julien Martin.</p>
      <p>Hébergeur : Google Cloud Run (Europe).</p>
    </div>
  );
}
