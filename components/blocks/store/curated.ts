import type { ComponentConfig } from '@measured/puck';

import { advocatesCharitiesConfig } from './advocates-charities';
import { advocatesDirectoryConfig } from './advocates-directory';
import { advocatesGridConfig } from './advocates-grid';
import { advocatesIntroConfig } from './advocates-intro';
import { advocatesVideoCarouselConfig } from './advocates-video-carousel';
import { advocacyCtasConfig } from './advocacy-ctas';
import { archedVideoCarouselConfig } from './arched-video-carousel';
import { backgroundManifestoConfig } from './background-manifesto';
import { backgroundReelsConfig } from './background-reels';
import { backgroundServicesGridConfig } from './background-services-grid';
import { banner2Config } from './banner2';
import { blogListCompact01Config } from './blog-list-compact-01';
import { caseStudies3Config } from './case-studies3';
import { contact2Config } from './contact2';
import { content1Config } from './content1';
import { cta10Config } from './cta10';
import { ctaLinksConfig } from './cta-links';
import { ethicalAdvisorConfig } from './ethical-advisor';
import { feature14Config } from './feature14';
import { feature17Config } from './feature17';
import { footer2Config } from './footer2';
import { founderNarrativeConfig } from './founder-narrative';
import { guestNotesConfig } from './guest-notes';
import { help2Config } from './help2';
import { hero01Config } from './hero-01';
import { legalDocumentConfig } from './legal-document';
import { logos8Config } from './logos8';
import { makeHeroConfig } from './make-hero';
import { makeHowWeWorkConfig } from './make-how-we-work';
import { navbar1Config } from './navbar1';
import { pricePanelConfig } from './price-panel';
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
import { stayDetailBodyConfig } from './stay-detail-body';
import { stayDetailMapConfig } from './stay-detail-map';
import { stayGalleryHeroConfig } from './stay-gallery-hero';
import { stayMetaBadgesConfig } from './stay-meta-badges';
import { staySimilarListingsConfig } from './stay-similar-listings';
import { staysDifferenceConfig } from './stays-difference';
import { staysIndexConfig } from './stays-index';
import { staysMapSectionConfig } from './stays-map-section';
import { staysPropertiesGridConfig } from './stays-properties-grid';
import { staysVideoCarouselConfig } from './stays-video-carousel';
import { testimonialsCards01Config } from './testimonials-cards-01';
import { testimonialsListConfig } from './testimonials-list';
import { testimonialsSimple01Config } from './testimonials-simple-01';
import { valuesListConfig } from './values-list';
import { verticalFeedScrollerConfig } from './vertical-feed-scroller';

import { editingSectionConfig } from './velvet/editing-section';
import { faqSectionConfig } from './velvet/faq-section';
import { featureBadgeGridConfig } from './velvet/feature-badge-grid';
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

export const storeBlocksCurated: Record<string, ComponentConfig<any>> = {
  StayMetaBadges: stayMetaBadgesConfig,
  StayGalleryHero: stayGalleryHeroConfig,
  StayDetailBody: stayDetailBodyConfig,
  StayDetailMap: stayDetailMapConfig,
  StaySimilarListings: staySimilarListingsConfig,
  PricePanel: pricePanelConfig,
  CtaLinks: ctaLinksConfig,
  StaysVideoCarousel: staysVideoCarouselConfig,
  StaysDifference: staysDifferenceConfig,
  StaysPropertiesGrid: staysPropertiesGridConfig,
  StaysMapSection: staysMapSectionConfig,
  AdvocatesGrid: advocatesGridConfig,
  AdvocacyCtas: advocacyCtasConfig,
  AdvocatesVideoCarousel: advocatesVideoCarouselConfig,
  AdvocatesIntro: advocatesIntroConfig,
  AdvocatesDirectory: advocatesDirectoryConfig,
  AdvocatesCharities: advocatesCharitiesConfig,
  BackgroundServicesGrid: backgroundServicesGridConfig,
  BackgroundReels: backgroundReelsConfig,
  BackgroundManifesto: backgroundManifestoConfig,
  LegalDocument: legalDocumentConfig,
  ArchedVideoCarousel: archedVideoCarouselConfig,
  VerticalFeedScroller: verticalFeedScrollerConfig,
  ValuesList: valuesListConfig,
  FounderNarrative: founderNarrativeConfig,
  EthicalAdvisor: ethicalAdvisorConfig,
  StaysIndex: staysIndexConfig,
  TestimonialsList: testimonialsListConfig,
  GuestNotes: guestNotesConfig,
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
};

