'use client';

import type { ComponentConfig } from '@puckeditor/core';

import { advocatesIntroConfig } from './advocates-intro';
import { advocacyCtasConfig } from './advocacy-ctas';
import { backgroundManifestoConfig } from './background-manifesto';
import { backgroundServicesGridConfig } from './background-services-grid';
import { banner2Config } from './banner2';
import { blogListCompact01Config } from './blog-list-compact-01';
import { caseStudies3Config } from './case-studies3';
import { contact2Config } from './contact2';
import { content1Config } from './content1';
import { cta10Config } from './cta10';
import { ethicalAdvisorConfig } from './ethical-advisor';
import { feature14Config } from './feature14';
import { feature17Config } from './feature17';
import { footer2Config } from './footer2';
import { founderNarrativeConfig } from './founder-narrative';
import { help2Config } from './help2';
import { hero01Config } from './hero-01';
import { legalDocumentConfig } from './legal-document';
import { logos8Config } from './logos8';
import { makeHeroConfig } from './make-hero';
import { makeHowWeWorkConfig } from './make-how-we-work';
import { navbar1Config } from './navbar1';
import { pricing2Config } from './pricing2';
import { process3Config } from './process3';
import { reviewsCtaConfig } from './reviews-cta';
import { services21Config } from './services21';
import { shadcnblocksAboutApproachConfig } from './shadcnblocks/about-approach';
import { shadcnblocksContact6Config } from './shadcnblocks/contact6';
import { shadcnblocksFaq12Config } from './shadcnblocks/faq12';
import { shadcnblocksFeature245Config } from './shadcnblocks/feature245';
import { shadcnblocksFeature284Config } from './shadcnblocks/feature284';
import { shadcnblocksGallery16Config } from './shadcnblocks/gallery16';
import { shadcnblocksHero107Config } from './shadcnblocks/hero107';
import { shadcnblocksHero3Config } from './shadcnblocks/hero3';
import { shadcnblocksNavbar9Config } from './shadcnblocks/navbar9';
import { shadcnblocksService5Config } from './shadcnblocks/service5';
import { shadcnblocksTestimonial23Config } from './shadcnblocks/testimonial23';
import { shadcnblocksTrustStrip4Config } from './shadcnblocks/trust-strip4';
import { staysDifferenceConfig } from './stays-difference';
import { staysMapSectionConfig } from './stays-map-section';
import { testimonialsCards01Config } from './testimonials-cards-01';
import { testimonialsSimple01Config } from './testimonials-simple-01';
import { valuesListConfig } from './values-list';
import { editingSectionConfig } from './velvet/editing-section';
import { faqSectionConfig } from './velvet/faq-section';
import { floatingHeaderConfig } from './velvet/floating-header';
import { footerConfig } from './velvet/footer';
import { founderBookingConfig } from './velvet/founder-booking';
import { heroConfig } from './velvet/hero';
import { legalOverviewConfig } from './velvet/legal-overview';
import { legalQuickLinksConfig } from './velvet/legal-quick-links';
import { legalSectionConfig } from './velvet/legal-section';
import { pricingHostingConfig } from './velvet/pricing-hosting';
import { pricingSectionConfig } from './velvet/pricing-section';
import { processSectionConfig } from './velvet/process-section';
import { servicesGridConfig } from './velvet/services-grid';
import { stackingCardsConfig } from './velvet/stacking-cards.config';
import { stickyCtaConfig } from './velvet/sticky-cta';
import { techStackConfig } from './velvet/tech-stack';
import { testimonialsSectionConfig } from './velvet/testimonials-section';
import { trustStripSectionConfig } from './velvet/trust-strip-section';
import { workTogetherFaqConfig } from './velvet/work-together-faq';

// Server-backed blocks are deliberately absent here. Their editor renders are
// supplied by components/puck/previews/store-preview-renders.ts so the browser
// bundle never imports Mongo models, node:fs, or next/cache.
export const storeBlocksCurated = {
  StaysDifference: staysDifferenceConfig,
  StaysMapSection: staysMapSectionConfig,
  AdvocacyCtas: advocacyCtasConfig,
  AdvocatesIntro: advocatesIntroConfig,
  BackgroundServicesGrid: backgroundServicesGridConfig,
  BackgroundManifesto: backgroundManifestoConfig,
  LegalDocument: legalDocumentConfig,
  ValuesList: valuesListConfig,
  FounderNarrative: founderNarrativeConfig,
  EthicalAdvisor: ethicalAdvisorConfig,
  ReviewsCta: reviewsCtaConfig,
  Banner2: banner2Config,
  Navbar1: navbar1Config,
  Hero01: hero01Config,
  MakeHero: makeHeroConfig,
  MakeHowWeWork: makeHowWeWorkConfig,
  Logos8: logos8Config,
  TestimonialsSimple01: testimonialsSimple01Config,
  TestimonialsCards01: testimonialsCards01Config,
  Feature17: feature17Config,
  Services21: services21Config,
  CaseStudies3: caseStudies3Config,
  Feature14: feature14Config,
  Pricing2: pricing2Config,
  Cta10: cta10Config,
  Contact2: contact2Config,
  Process3: process3Config,
  Help2: help2Config,
  BlogListCompact01: blogListCompact01Config,
  Footer2: footer2Config,
  Content1: content1Config,
  VelvetFloatingHeader: floatingHeaderConfig,
  VelvetHero: heroConfig,
  VelvetTrustStrip: trustStripSectionConfig,
  VelvetServicesGrid: servicesGridConfig,
  VelvetStackingCards: stackingCardsConfig,
  VelvetStickyCta: stickyCtaConfig,
  VelvetTestimonials: testimonialsSectionConfig,
  VelvetEditing: editingSectionConfig,
  VelvetTechStack: techStackConfig,
  VelvetPricing: pricingSectionConfig,
  VelvetPricingHosting: pricingHostingConfig,
  VelvetFounderBooking: founderBookingConfig,
  VelvetProcess: processSectionConfig,
  VelvetWorkTogetherFaq: workTogetherFaqConfig,
  VelvetFaqSection: faqSectionConfig,
  VelvetFooter: footerConfig,
  VelvetLegalOverview: legalOverviewConfig,
  VelvetLegalQuickLinks: legalQuickLinksConfig,
  VelvetLegalSection: legalSectionConfig,
  ShadcnblocksNavbar9: shadcnblocksNavbar9Config,
  ShadcnblocksHero3: shadcnblocksHero3Config,
  ShadcnblocksHero107: shadcnblocksHero107Config,
  ShadcnblocksTrustStrip4: shadcnblocksTrustStrip4Config,
  ShadcnblocksFeature284: shadcnblocksFeature284Config,
  ShadcnblocksGallery16: shadcnblocksGallery16Config,
  ShadcnblocksFeature245: shadcnblocksFeature245Config,
  ShadcnblocksTestimonial23: shadcnblocksTestimonial23Config,
  ShadcnblocksService5: shadcnblocksService5Config,
  ShadcnblocksAboutApproach: shadcnblocksAboutApproachConfig,
  ShadcnblocksFaq12: shadcnblocksFaq12Config,
  ShadcnblocksContact6: shadcnblocksContact6Config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as unknown as Record<string, ComponentConfig<any>>;
