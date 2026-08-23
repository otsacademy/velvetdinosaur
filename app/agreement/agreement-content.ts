// Content model + v3.0 text for the /agreement page (and its PDF).
// **double asterisks** mark bold runs, rendered by RichText in page.tsx.

export type AgreementBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "keybox"; text: string }
  | { type: "small"; text: string }

export type AgreementSection = {
  id: string
  num: string
  title: string
  blocks: AgreementBlock[]
}

export const AGREEMENT_VERSION = "Version 3.0 — August 2026"

export const SHORT_VERSION = [
  "We build a working demonstration of your new website **before you pay us**.",
  "You can try the website and administration system free for **14 days**.",
  "If you decide to proceed, the service costs **£99 per month**, payable monthly, with no setup or website-build fee.",
  "The initial agreement lasts **12 months**, then becomes a rolling monthly service — unless you renew for another fixed term and receive a complimentary design refresh.",
  "Your first 30 days are covered by our **30-day money-back guarantee**.",
  "Your domain, business content and business data remain yours. The Velvet Dinosaur software and Sauro platform remain ours.",
] as const

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: "service",
    num: "1",
    title: "The service",
    blocks: [
      { type: "p", text: "For **£99 per month**, Velvet Dinosaur provides a managed website service for your business. The standard service includes:" },
      {
        type: "list",
        items: [
          "a professionally designed responsive website;",
          "Velvet Dinosaur's Sauro content management system;",
          "website hosting, SSL certificate, routine backups and monitoring;",
          "security and software maintenance;",
          "reasonable technical support;",
          "standard contact and enquiry forms, and a central website enquiry inbox;",
          "social-media links and standard integrations;",
          "news, pages, images and other content-management facilities;",
          "a standard business domain where required, plus domain configuration;",
          "and, where appropriate for your business, standard Velvet Dinosaur booking functionality.",
        ],
      },
      { type: "p", text: "Other standard platform functionality may be made available as the service develops. The precise features enabled for your website will be shown in your demonstration or order." },
      { type: "p", text: "There is **no setup fee and no website-build fee** for the standard service." },
    ],
  },
  {
    id: "demonstration",
    num: "2",
    title: "Your free 14-day demonstration",
    blocks: [
      { type: "p", text: "Before asking you to subscribe, we may create a working demonstration website based upon publicly available information about your business and information you provide to us. We will normally provide:" },
      {
        type: "list",
        items: [
          "a private demonstration website;",
          "temporary access to the Sauro CMS;",
          "demonstration forms and enquiries;",
          "demonstration booking functionality where relevant;",
          "and other appropriate features of the proposed website.",
        ],
      },
      { type: "p", text: "The demonstration lasts for **14 days** unless we agree otherwise. It costs nothing and does not oblige you to purchase anything." },
      { type: "p", text: "The demonstration is intended for evaluation and must not be treated as your live business website. We will take reasonable measures to prevent demonstration websites from being indexed by search engines." },
      { type: "p", text: "You should not enter sensitive, confidential or real customer information into a demonstration website. Where payment functionality is demonstrated, it will normally use test or sandbox systems." },
      { type: "p", text: "If you do not proceed, we may permanently delete the demonstration and its associated data after the demonstration period. We will not charge you simply because you used the demonstration." },
    ],
  },
  {
    id: "subscribing",
    num: "3",
    title: "Subscribing",
    blocks: [
      { type: "p", text: "If you decide to proceed, you subscribe through the order or signup process. Your subscription begins on the date shown in your order." },
      { type: "p", text: "The standard subscription is **£99 per month**, payable monthly in advance. The initial term is **12 months**." },
      { type: "p", text: "By subscribing you agree to this agreement and the corresponding order." },
    ],
  },
  {
    id: "refinement",
    num: "4",
    title: "Your seven-day refinement period",
    blocks: [
      { type: "p", text: "After subscribing, we will normally allow up to **seven days** to refine the website before its initial launch. This can include reasonable changes to matters such as:" },
      {
        type: "list",
        items: [
          "text, photographs, colours, typography and layout;",
          "services, prices, opening hours and menus;",
          "calls to action and booking configuration;",
          "and other existing website content.",
        ],
      },
      { type: "p", text: "You can discuss these changes with us through whichever reasonable channel is most suitable, including email, chat, our support system, telephone, video meeting or, where practical, an in-person meeting." },
      { type: "p", text: "The purpose of this period is to refine the website already demonstrated to you. It does not include unlimited bespoke software development or an entirely different project from the one demonstrated." },
      { type: "p", text: "If you approve the website earlier, it can be launched earlier. Where delays are caused by us, we will work with you to agree a revised launch date. Where delays arise because we are waiting for information, content, access or approval from you, the launch date may move accordingly." },
    ],
  },
  {
    id: "guarantee",
    num: "5",
    title: "Our 30-day money-back guarantee",
    blocks: [
      {
        type: "keybox",
        text: "We want you to stay because you value the service. During your **first 30 days as a paying subscriber**, you may tell us that Velvet Dinosaur is not right for you. We will cancel your subscription, refund all standard subscription payments you have made to us, and help you recover or transfer any domain or business content that belongs to you. You do not need to give us a reason.",
      },
      { type: "p", text: "This is a voluntary Velvet Dinosaur guarantee and does not replace any statutory rights you may have." },
      { type: "small", text: "Third-party expenditure that you specifically instructed us to incur outside the standard £99 service may be treated separately where we told you beforehand that the cost was non-refundable." },
    ],
  },
  {
    id: "initial-term",
    num: "6",
    title: "The initial 12-month term",
    blocks: [
      { type: "p", text: "After the first 30 days, your subscription continues for the remainder of the initial 12-month term. You remain responsible for the monthly subscription charges during that initial term unless:" },
      {
        type: "list",
        items: [
          "we materially breach this agreement and fail to remedy the breach within a reasonable period;",
          "we agree otherwise with you in writing;",
          "or the law gives you another right to terminate.",
        ],
      },
      { type: "p", text: "We are not interested in keeping customers through unnecessary contractual obstacles and will always try to resolve problems reasonably." },
    ],
  },
  {
    id: "after-first-year",
    num: "7",
    title: "After the first 12 months",
    blocks: [
      { type: "p", text: "At the end of your initial 12-month term, you have two main options." },
      { type: "h3", text: "Continue" },
      { type: "p", text: "Your service becomes a rolling monthly subscription. You may then cancel at any time by giving us **30 days' notice**." },
      { type: "h3", text: "Refresh & Renew" },
      { type: "p", text: "You may enter another 12-month agreement and receive a **complimentary website design refresh** — a new visual treatment of your existing website using your existing content, functionality and business information. It may include new layouts, typography, imagery treatment, styling and presentation. Your CMS information, enquiries, customer information, booking configuration and other business data remain available." },
      { type: "p", text: "The complimentary refresh does not automatically include:" },
      {
        type: "list",
        items: [
          "completely new bespoke software;",
          "major new integrations;",
          "a new ecommerce platform;",
          "substantial new functionality;",
          "or work unrelated to your existing website.",
        ],
      },
      { type: "p", text: "We will give you a reasonable refinement period before the refreshed design replaces your existing design. Your existing website remains available until the new version is ready to launch." },
    ],
  },
  {
    id: "changes-after-launch",
    num: "8",
    title: "Website changes after launch",
    blocks: [
      { type: "p", text: "You may use the Sauro CMS to update the content made editable through your website. You may also ask us for reasonable assistance. Routine support and reasonable minor website changes are included within the subscription. Examples include:" },
      {
        type: "list",
        items: [
          "correcting text and updating opening hours;",
          "replacing an image or changing a price;",
          "adding or removing a team member;",
          "updating a menu or changing contact information;",
          "and similar day-to-day amendments.",
        ],
      },
      { type: "p", text: "The service is subject to reasonable use. If a request amounts to significant content production, substantial redesign, data entry, bespoke development or a new project, we will tell you before carrying out chargeable work. **You will never receive an additional charge without agreeing to it first.**" },
    ],
  },
  {
    id: "bookings",
    num: "9",
    title: "Bookings, enquiries and business tools",
    blocks: [
      { type: "p", text: "Where your website includes Velvet Dinosaur booking functionality, you remain responsible for:" },
      {
        type: "list",
        items: [
          "deciding what services can be booked, and setting prices and availability;",
          "managing staff or resources;",
          "honouring bookings, cancellations and refunds;",
          "and complying with laws and regulations applicable to your particular business.",
        ],
      },
      { type: "p", text: "Velvet Dinosaur provides the technical facility through which bookings may be made. We are not a party to the underlying transaction between you and your customer. Similarly, Velvet Dinosaur does not become responsible for the contents of enquiries, messages or transactions merely because they pass through our systems." },
    ],
  },
  {
    id: "payments",
    num: "10",
    title: "Payments and ecommerce",
    blocks: [
      { type: "p", text: "Where your website accepts payments, these will normally be processed by an external payment provider such as Stripe or another agreed provider. Payment card information should normally be handled by the payment provider rather than stored directly by Velvet Dinosaur." },
      { type: "p", text: "Unless your order expressly says otherwise:" },
      {
        type: "list",
        items: [
          "payment-provider transaction fees are your responsibility;",
          "refunds to your customers are your responsibility;",
          "chargebacks are your responsibility;",
          "and Velvet Dinosaur does not receive a percentage of your sales.",
        ],
      },
      { type: "p", text: "If ecommerce functionality is enabled, any additional scope will be confirmed with you." },
    ],
  },
  {
    id: "external-services",
    num: "11",
    title: "Social media and external services",
    blocks: [
      { type: "p", text: "We may connect your website to third-party services such as social-media platforms, mapping services, analytics services, payment processors, email providers, calendar systems, booking integrations, or other external services." },
      { type: "p", text: "Those services remain operated by their respective providers. We cannot guarantee that a third party will continue offering a particular API, feature, price or service indefinitely. Where a third-party change affects your website, we will make reasonable efforts to provide an alternative." },
      { type: "p", text: "We are not responsible for outages or failures caused solely by third-party services outside our reasonable control." },
    ],
  },
  {
    id: "domains",
    num: "12",
    title: "Domain names",
    blocks: [
      { type: "p", text: "Where a standard domain is included, Velvet Dinosaur will pay the ordinary registration and renewal cost while your subscription remains active. This applies to domains with a reasonable standard annual registration cost. Premium domains, unusually expensive domains and aftermarket purchases are not included unless agreed separately." },
      { type: "p", text: "The domain belongs to **you**, not Velvet Dinosaur. Where technically possible, it will be registered in your name. Where a registrar requires it to be administered through our account, you remain the beneficial owner and we will transfer it to you when reasonably requested or when the service ends." },
      { type: "p", text: "You are responsible for ensuring that the domain name you ask us to use does not unlawfully infringe another person's rights." },
    ],
  },
  {
    id: "your-content",
    num: "13",
    title: "Your content",
    blocks: [
      { type: "p", text: "You retain ownership of content belonging to you, including:" },
      {
        type: "list",
        items: [
          "your logo, branding and photographs;",
          "your written material and business information;",
          "your products and services;",
          "your customer data, booking data and enquiry data.",
        ],
      },
      { type: "p", text: "You give Velvet Dinosaur permission to host, copy, process, resize, display and otherwise use that material where reasonably necessary to provide the service. You confirm that content you supply to us may lawfully be used on your website. You must not knowingly provide unlawful, defamatory, infringing or malicious material." },
    ],
  },
  {
    id: "technology",
    num: "14",
    title: "Velvet Dinosaur technology",
    blocks: [
      { type: "p", text: "The website operates using technology developed, licensed or maintained by Velvet Dinosaur. This may include Sauro CMS, software libraries, reusable components, templates, administration systems, booking software, enquiry systems, deployment systems, APIs, development tools, and other shared platform technology." },
      { type: "p", text: "That underlying platform remains the intellectual property of Velvet Dinosaur or its respective licensors. Your subscription gives you the right to use the service while the subscription remains active. It does not transfer ownership of the Velvet Dinosaur platform or its source code to you." },
    ],
  },
  {
    id: "leaving",
    num: "15",
    title: "Leaving Velvet Dinosaur",
    blocks: [
      { type: "p", text: "We deliberately do not hold your domain, content or business data hostage. When the service ends, we will:" },
      {
        type: "list",
        items: [
          "stop future subscription payments;",
          "allow you to transfer or redirect your domain;",
          "provide a practical export of your website content and business data;",
          "and provide reasonable assistance with moving to another provider.",
        ],
      },
      { type: "p", text: "We will normally keep an export available for **30 days after termination**. After that period, we may delete the remaining data unless the law requires us to retain something." },
      { type: "p", text: "Because Sauro is a Velvet Dinosaur platform, the export does not necessarily include a working copy of Sauro or Velvet Dinosaur's proprietary software. We will, however, provide your content and data in a reasonably usable format." },
    ],
  },
  {
    id: "personal-data",
    num: "16",
    title: "Personal data",
    blocks: [
      { type: "p", text: "For information relating to your own Velvet Dinosaur account, billing and customer relationship, Velvet Dinosaur acts as a data controller." },
      { type: "p", text: "Where Velvet Dinosaur processes personal information belonging to your customers solely to operate services such as enquiries, bookings, mailing-list submissions, customer records, or similar website functions, you will generally be the controller and Velvet Dinosaur will generally act as your processor. We will:" },
      {
        type: "list",
        items: [
          "process such information only for providing the service and on your documented instructions;",
          "apply appropriate technical and organisational security measures, and restrict access appropriately;",
          "notify you without undue delay if we become aware of a personal-data breach affecting your data;",
          "assist reasonably with relevant data-protection obligations;",
          "delete or return personal data when our processing relationship ends, subject to legitimate retention requirements;",
          "and ensure anyone processing data on our behalf is subject to appropriate confidentiality and data-protection obligations.",
        ],
      },
      { type: "p", text: "Where necessary, more detailed data-processing terms may form part of the order or a separate Data Processing Agreement. You remain responsible for determining whether and how you may lawfully collect and use information through your website." },
    ],
  },
  {
    id: "security",
    num: "17",
    title: "Security and backups",
    blocks: [
      { type: "p", text: "We will take reasonable technical and organisational measures to protect the website and the information we process. These may include encrypted connections, access controls, software updates, backups, infrastructure monitoring, and appropriate security practices." },
      { type: "p", text: "No online service can guarantee absolute security or uninterrupted availability. You are responsible for protecting your CMS credentials, using suitable passwords, not sharing administrative access unnecessarily, and telling us promptly if you believe your account has been compromised." },
    ],
  },
  {
    id: "availability",
    num: "18",
    title: "Availability and maintenance",
    blocks: [
      { type: "p", text: "We aim to keep your website available continuously. However, websites occasionally require maintenance, security updates, infrastructure work, emergency changes, or intervention following third-party outages. We therefore do not promise 100% uninterrupted availability." },
      { type: "p", text: "Where practical, planned maintenance likely to cause significant disruption will be scheduled to minimise inconvenience. If a serious problem occurs, we will work to restore the service as quickly as reasonably possible." },
    ],
  },
  {
    id: "support",
    num: "19",
    title: "Support",
    blocks: [
      { type: "p", text: "Velvet Dinosaur is intended to be a managed service rather than simply website hosting. You may contact us using the support channels we make available, and we will make reasonable efforts to respond promptly." },
      { type: "p", text: "Support is provided during reasonable business hours except where an urgent technical problem affects the availability or security of the service. We do not guarantee that every non-urgent request will be completed immediately." },
    ],
  },
  {
    id: "paying",
    num: "20",
    title: "Paying us",
    blocks: [
      { type: "p", text: "The standard subscription is **£99 per month**, payable monthly in advance. Unless stated otherwise, the applicable VAT treatment will be shown on your invoice." },
      { type: "p", text: "If a payment fails, we will contact you and normally attempt payment again. If an undisputed payment remains outstanding for more than **14 days**, we may suspend the service after giving you reasonable warning. We will not deliberately delete your website immediately because a card expires or a payment fails." },
    ],
  },
  {
    id: "price-changes",
    num: "21",
    title: "Price changes",
    blocks: [
      { type: "p", text: "We will not increase the £99 monthly price during your initial 12-month term. After that term, we may change our pricing by giving you at least **60 days' written notice**. A changed price will not take effect retrospectively." },
      { type: "p", text: "If you do not wish to accept a price increase after your minimum term, you may cancel the service before it takes effect." },
    ],
  },
  {
    id: "ending",
    num: "22",
    title: "Ending the agreement",
    blocks: [
      { type: "h3", text: "During your first 30 days" },
      { type: "p", text: "You may use the money-back guarantee in section 5." },
      { type: "h3", text: "During the remainder of the initial term" },
      { type: "p", text: "The agreement continues until the end of the initial 12 months unless another termination right applies." },
      { type: "h3", text: "After the initial term" },
      { type: "p", text: "Either party may terminate the rolling service by giving **30 days' written notice**." },
      { type: "p", text: "We may suspend or terminate the service sooner where reasonably necessary because of unlawful use, deliberate misuse, serious security threats, persistent non-payment, fraud, abuse of our staff, or another fundamental breach of this agreement. Where practical, we will contact you and give you an opportunity to resolve the issue first." },
    ],
  },
  {
    id: "responsibility",
    num: "23",
    title: "Our responsibility to you",
    blocks: [
      { type: "p", text: "We will provide the service with reasonable care and skill. Neither party excludes liability where the law does not permit liability to be excluded, including liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or another liability that cannot lawfully be excluded." },
      { type: "p", text: "Neither party will normally be responsible for indirect or unforeseeable losses. Subject to liabilities that cannot lawfully be limited, Velvet Dinosaur's total liability arising from the service during any 12-month period will normally be limited to the total fees paid or payable by you to Velvet Dinosaur for the service during that period. Nothing in this section reduces any rights that cannot legally be restricted." },
    ],
  },
  {
    id: "force-majeure",
    num: "24",
    title: "Events outside either party's control",
    blocks: [
      { type: "p", text: "Neither party is responsible for failing to perform an obligation where this is caused by circumstances genuinely outside its reasonable control. Examples may include major infrastructure failures, natural disasters, widespread telecommunications outages, war, government action or similar events. This does not remove an obligation to act reasonably to reduce the effect of such an event." },
    ],
  },
  {
    id: "changes-to-agreement",
    num: "25",
    title: "Changes to this agreement",
    blocks: [
      { type: "p", text: "We may update these standard terms where reasonably necessary because of changes in law, security requirements, changes to the platform, new functionality, or changes to how the service operates." },
      { type: "p", text: "We will give existing customers reasonable notice where a change materially affects their rights or obligations. A change will not retrospectively remove a benefit already promised for an existing contractual term." },
    ],
  },
  {
    id: "notices",
    num: "26",
    title: "Notices",
    blocks: [
      { type: "p", text: "Routine communication may take place by email, through our support system or through the contact information associated with your account. Formal cancellation notices may be sent by email to the address specified by Velvet Dinosaur for that purpose. You are responsible for keeping your contact details reasonably up to date." },
    ],
  },
  {
    id: "general",
    num: "27",
    title: "General",
    blocks: [
      { type: "p", text: "This agreement and your order constitute the agreement between us for the service. If there is a conflict between this agreement and a specifically agreed order, the expressly agreed terms in the order take priority." },
      { type: "p", text: "If any provision is found to be invalid or unenforceable, the remainder of the agreement continues. A failure by either party to enforce a provision immediately does not permanently waive that provision." },
      { type: "p", text: "Neither party may transfer this agreement in a way that materially prejudices the other party without reasonable justification. Nothing in this agreement creates a partnership, employment relationship or agency between us. No third party has the right to enforce this agreement under the Contracts (Rights of Third Parties) Act 1999 unless expressly stated otherwise." },
    ],
  },
  {
    id: "governing-law",
    num: "28",
    title: "Governing law",
    blocks: [
      { type: "p", text: "This agreement is governed by the laws of **England and Wales**. The courts of England and Wales will have jurisdiction over disputes arising from it. Before starting court proceedings, both parties agree to make reasonable efforts to resolve the dispute directly." },
    ],
  },
]
