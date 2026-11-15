import { DesignShell } from "./design-shell"
import { HomeQuestions } from "./faq-accordion"
import { HomeHero, ShortVersion } from "./home-hero"
import { HomeJourney } from "./home-journey"
import { HomePricing } from "./home-pricing"
import { HomeWork } from "./home-sections"
import { HomeSignOff } from "./home-signoff"
import { HomeReviews } from "./home-social"

// The home page is one letter from Ian, read top to bottom: the offer, how it
// works, what you get, the work, what clients say, the usual questions, and a
// sign-off. Everything is server-rendered; the only client code on the page is
// the small-screen menu in the header.
export function HomeSite() {
  return (
    <DesignShell>
      <HomeHero />
      <ShortVersion />
      <HomeJourney />
      <HomePricing />
      <HomeWork />
      <HomeReviews />
      <HomeQuestions />
      <HomeSignOff />
    </DesignShell>
  )
}
