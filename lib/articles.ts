import type { NewsEditorDocumentSettings } from '@/lib/news-editor-document-settings';

export type ArticleCallout = {
  title: string;
  description: string;
};

export type ArticleTable = {
  headers: [string, string];
  rows: Array<[string, string]>;
};

export type ArticleSection = {
  id?: string;
  heading: string;
  paragraphs: string[];
  quote?: string;
  listItems?: string[];
  table?: ArticleTable;
  alert?: ArticleCallout;
};

export type ArticleAuthorProfile = {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  academicTitle: string;
  primaryChapterSlug: string;
  primaryChapterName?: string;
  chapterSlugs: string[];
  institution: string;
  department: string;
  country: string;
  location: string;
  bio: string;
  orcidId: string;
  orcidUrl: string;
  scholarUrl: string;
};

export type ArticleChapterSnapshot = {
  primaryChapterSlug: string;
  primaryChapterName: string;
  chapterSlugs: string[];
  capturedAt?: string | null;
};

export interface Article {
  slug: string;
  img: string;
  tag: string;
  tags?: string[];
  title: string;
  subtitle?: string;
  desc: string;
  website?: string;
  outcome?: string;
  date: string;
  readTime?: string;
  imageCaption?: string;
  author: { img: string; name: string };
  authorUserId?: string | null;
  primaryChapterSlug?: string;
  primaryChapterName?: string;
  chapterSlugs?: string[];
  chapterSnapshot?: ArticleChapterSnapshot | null;
  authorProfile?: ArticleAuthorProfile | null;
  authorSnapshot?: { img: string; name: string; capturedAt?: string | null } | null;
  status?: 'draft' | 'scheduled' | 'published';
  publishAt?: string;
  sections?: ArticleSection[];
  content: {
    intro: string;
    heroImg: string;
    sections: {
      id: string;
      title: string;
      body: string;
    }[];
  };
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoSource?: 'manual' | 'auto' | null;
  seoGeneratedAt?: string | null;
  seoModel?: string | null;
  seoNeedsReview?: boolean;
  editorSettings?: NewsEditorDocumentSettings;
}

export const ALL_ARTICLES: Article[] = [
  {
    slug: "2025-nelson-mandela-essay-prize-winners",
    img: "/images/news-mandela.jpg",
    tag: "Essay Prize",
    title: "2025 Nelson Mandela Essay Prize Winners",
    desc: "ASAP and the Yale University Global Justice Program, in partnership with the University of Zambia and the University of Lusaka, are proud to announce the 2025 Nelson Mandela Essay Prize winners.",
    date: "Posted on 15 Jan 2026",
    author: { img: "", name: "ASAP Editorial" },
    content: {
      intro:
        "ASAP and the Yale University Global Justice Program, in partnership with the University of Zambia and the University of Lusaka, are proud to announce the winners of the 2025 Nelson Mandela Essay Prize Competition. This year's essays demonstrated exceptional insight into the challenges facing Africa and the Global South.",
      heroImg: "/images/news-mandela.jpg",
      sections: [
        {
          id: "first-prize",
          title: "1st Prize: Evaida Chimedza",
          body: "Evaida Chimedza has been awarded first prize for her essay \"The African Paradox: A Land of Wealth, a People in Need.\" Her work provides a compelling examination of the contradictions inherent in Africa's resource abundance and persistent poverty, exploring how structural inequalities, governance failures, and exploitative global trade practices perpetuate deprivation amidst plenty.\n\nThe judging panel praised her essay for its analytical depth, clarity of argument, and practical policy recommendations for breaking the cycle of the resource curse.",
        },
        {
          id: "second-prize",
          title: "2nd Prize: Grace Gondwe",
          body: "Grace Gondwe earned second prize for her essay \"Non-Formal Education and Civic Engagement Among African Youth.\" Her research explores how educational initiatives outside traditional schooling systems can empower young people to become active participants in democratic processes and community development.\n\nThe essay highlights innovative programs across sub-Saharan Africa that combine skills training with civic education, demonstrating how non-formal learning environments can foster a new generation of engaged citizens committed to fighting poverty.",
        },
        {
          id: "third-prize",
          title: "3rd Prize: Clautrida Mutabaruka & Nater Akpen",
          body: "The third prize was shared between two outstanding submissions. Clautrida Mutabaruka's essay \"Youth Power and Indigenous Peacebuilding\" examines how young people in conflict-affected regions draw on indigenous knowledge systems to build peace and reduce the poverty that accompanies prolonged violence.\n\nNater Akpen's essay \"Farmer-Herder Crisis: Trade and Gender Inclusion\" analyzes the intersection of agricultural conflict, trade policy, and gender inequality, proposing integrated solutions that address the economic root causes of farmer-herder tensions while ensuring women's meaningful participation in peace processes and economic development.",
        },
      ],
    },
  },
  {
    slug: "asap-2024-book-awards-winners",
    img: "/images/news-books.jpg",
    tag: "Book Awards",
    title: "ASAP 2024 Book Awards Winners Announced",
    desc: "Academics Stand Against Poverty (ASAP) is proud to announce the 2024 Book Awards winners. The Lifetime Achievement Award goes to a pioneering scholar whose decades of work have fundamentally reshaped our understanding of global economic disparities.",
    date: "Posted on 10 Dec 2025",
    author: { img: "", name: "Thomas Pogge" },
    content: {
      intro:
        "The ASAP Book Awards represent more than just academic recognition. They are a beacon of hope, showing us pathways to understanding and addressing the complex challenges of poverty worldwide. The 2024 awards highlight the extraordinary depth and breadth of poverty research.",
      heroImg: "/images/news-books.jpg",
      sections: [
        {
          id: "lifetime-achievement",
          title: "Lifetime Achievement Award",
          body: "The 2024 Lifetime Achievement Award honors a pioneering scholar whose decades of work have fundamentally reshaped our understanding of global economic disparities. Their contributions span multiple disciplines, from philosophy and economics to public policy, creating frameworks that continue to guide poverty reduction strategies worldwide.\n\nThis recognition celebrates not only academic excellence but a lifetime of commitment to making scholarly work accessible and actionable for policymakers and practitioners.",
        },
        {
          id: "book-of-the-year",
          title: "Book of the Year Awards",
          body: 'The Book of the Year Award for Monographs was awarded to an exceptional team for their groundbreaking work "The Escape from Poverty: Breaking the Vicious Cycles Perpetuating Disadvantage." This book offers a critical examination of the systemic barriers that trap communities in poverty.\n\nComplementing this work, the Edited Book Award recognizes a volume that demonstrates how philosophical inquiry can provide profound insights into poverty\'s structural roots, bringing together perspectives from leading thinkers across disciplines.',
        },
        {
          id: "call-for-nominations",
          title: "Call for 2025 Nominations",
          body: "We now invite scholars, researchers, and thought leaders to submit their most impactful work for the 2025 ASAP Book Awards. Our categories remain unchanged: Lifetime Achievement Award, Book of the Year Award (Single/Group Author), and Book of the Year Award (Edited Collection).\n\nBooks published in 2025 that contribute meaningfully to understanding, describing, explaining, or addressing poverty are eligible. We seek works that go beyond mere description -- scholarship that offers actionable insights and potential pathways to meaningful change. Deadline: July 31, 2026.",
        },
      ],
    },
  },
  {
    slug: "2024-amartya-sen-essay-prize-winners",
    img: "/images/news-essay.jpg",
    tag: "Awards",
    title: "2024 Amartya Sen Essay Prize Winners",
    desc: "ASAP is proud to announce the winners of its fourth annual Amartya Sen Essay Prize Competition. This year's competition attracted submissions from around the world examining illicit financial flows and their harmful impacts on global poverty.",
    date: "Posted on 22 Nov 2025",
    author: { img: "", name: "Daniele Botti" },
    content: {
      intro:
        "The Amartya Sen Essay Prize recognizes outstanding essays examining illicit financial flows, their harmful impacts, and potential reforms. This annual award brings attention to one of the most critical yet under-discussed aspects of global poverty.",
      heroImg: "/images/news-essay.jpg",
      sections: [
        {
          id: "about-the-prize",
          title: "About the Prize",
          body: "Named after Nobel laureate Amartya Sen, this annual award recognizes outstanding essays examining illicit financial flows, their harmful impacts, and potential reforms. The prize brings attention to critical aspects of global poverty that are often overlooked in mainstream discourse.\n\nThe competition is open to scholars at all career stages, from doctoral students to established professors, reflecting ASAP's commitment to nurturing diverse voices in poverty research.",
        },
        {
          id: "winning-essays",
          title: "Winning Essays",
          body: 'The first-place essay, "Shadow Economies and State Fragility," provides a comprehensive analysis of how illicit financial flows undermine state capacity in developing countries. The author presents compelling evidence linking tax evasion by multinational corporations to reduced public spending on health and education.\n\nThe second-place essay examines cryptocurrency regulation as a tool for combating money laundering, while the third-place essay explores the gender dimensions of illicit financial flows in West Africa.',
        },
        {
          id: "judges-commentary",
          title: "Judges' Commentary",
          body: "The judging panel noted the exceptional quality of submissions, highlighting the growing sophistication of research in this field. The winners demonstrated not only analytical rigor but also a commitment to proposing practical solutions.\n\nProfessor Thomas Pogge noted: \"These essays represent the best of what academic research can offer -- rigorous analysis combined with a genuine commitment to improving the lives of the world's poorest people.\"",
        },
      ],
    },
  },
  {
    slug: "african-union-g20-seat",
    img: "/images/news-g20.jpg",
    tag: "Global Policy",
    title: "African Union Secures a Seat at the G20 Table",
    desc: "A significant step forward in global governance. The AU's permanent membership in the G20 signals growing recognition of Africa's role in shaping international economic policy, opening new pathways for poverty reduction.",
    date: "Posted on 3 Oct 2025",
    author: { img: "", name: "Catarina Tully" },
    content: {
      intro:
        "The African Union's permanent membership in the G20 marks a watershed moment in global governance. This development signals a growing recognition that effective poverty reduction requires the meaningful participation of those most affected by global economic policies.",
      heroImg: "/images/news-g20.jpg",
      sections: [
        {
          id: "significance",
          title: "Why This Matters",
          body: "The inclusion of the African Union as a permanent member of the G20 represents a fundamental shift in how global economic governance operates. For too long, decisions affecting billions of people in developing countries have been made without their adequate representation at the table.\n\nThis change opens new pathways for poverty reduction by ensuring that African perspectives are integrated into discussions on trade, finance, climate change, and development.",
        },
        {
          id: "implications-for-poverty",
          title: "Implications for Poverty Reduction",
          body: "With Africa home to a large share of the world's extreme poor, the continent's representation in the G20 could lead to more equitable trade agreements, greater scrutiny of illicit financial flows from African nations, and more targeted climate finance.\n\nASAP has long advocated for structural reforms in global governance institutions. This development aligns with our mission to address the systemic drivers of poverty, including the lack of democratic representation in international decision-making.",
        },
        {
          id: "looking-ahead",
          title: "Looking Ahead",
          body: "While the AU's G20 membership is a positive step, much work remains. ASAP will continue to monitor how this representation translates into concrete policy changes that benefit the world's poorest communities.\n\nWe encourage our members and chapters to engage with this development through research, policy briefs, and public engagement, helping to ensure that this historic opportunity leads to meaningful change.",
        },
      ],
    },
  },
  {
    slug: "global-chapter-network-expansion",
    img: "/images/news-chapter.jpg",
    tag: "Network",
    title: "ASAP Global Chapter Network Continues to Expand",
    desc: "With over 18 established and emerging chapters around the world, ASAP's network is stronger than ever. New chapters in Southeast Asia and Latin America are addressing region-specific poverty challenges.",
    date: "Posted on 18 Sep 2025",
    author: { img: "", name: "Mihaita Lupu" },
    content: {
      intro:
        "ASAP's strength lies in its diverse network of chapters around the world. With new chapters emerging in Southeast Asia and Latin America, the network is reaching new communities and addressing poverty challenges specific to each region.",
      heroImg: "/images/news-chapter.jpg",
      sections: [
        {
          id: "new-chapters",
          title: "New Chapters",
          body: "This year, ASAP welcomed new chapters in Vietnam, Colombia, and Kenya, bringing the total to over 18 established and emerging chapters worldwide. Each chapter is led by local academics and researchers who understand the specific poverty challenges facing their communities.\n\nThe new Vietnam chapter is focusing on labor rights and supply chain ethics, while the Colombia chapter is examining the links between conflict, displacement, and poverty.",
        },
        {
          id: "chapter-impact",
          title: "Chapter Impact",
          body: "ASAP chapters serve as hubs for local engagement, connecting academics with policymakers, civil society organizations, and communities. Through workshops, public lectures, and collaborative research projects, chapters translate global insights into local action.\n\nRecent chapter-led initiatives include a poverty mapping project in India, a financial literacy program in Nigeria, and a policy brief series on housing affordability in Australia.",
        },
        {
          id: "join-a-chapter",
          title: "How to Get Involved",
          body: "Whether you're an established researcher or a student just beginning your academic journey, there's a place for you in ASAP's chapter network. You can join an existing chapter in your region or start a new one with support from ASAP Global.\n\nTo learn more about chapters in your area or to express interest in founding a new chapter, contact us at global@academicsstand.org.",
        },
      ],
    },
  },
  {
    slug: "journal-asap-climate-change-poverty",
    img: "/images/news-journal.jpg",
    tag: "Journal",
    title: "Journal ASAP: New Issue on Climate Change and Poverty",
    desc: "The latest issue of our international, multidisciplinary journal explores the intersection of climate change and poverty. Featuring contributions from researchers across disciplines.",
    date: "Posted on 5 Aug 2025",
    author: { img: "", name: "Michal Apollo" },
    content: {
      intro:
        "The latest issue of Journal ASAP brings together leading researchers from climate science, economics, philosophy, and development studies to examine one of the most pressing challenges of our time: the intersection of climate change and global poverty.",
      heroImg: "/images/news-journal.jpg",
      sections: [
        {
          id: "featured-articles",
          title: "Featured Articles",
          body: "This issue includes groundbreaking research on climate-induced displacement and its economic impacts on vulnerable communities, an analysis of carbon pricing mechanisms and their distributional effects, and a philosophical examination of climate justice and intergenerational equity.\n\nA highlight is the lead article examining how climate adaptation funding can be redesigned to better serve the poorest communities, drawing on case studies from Bangladesh, Mozambique, and Pacific Island nations.",
        },
        {
          id: "editorial-perspective",
          title: "Editorial Perspective",
          body: "As the editorial team notes, climate change is not merely an environmental issue but a profound social justice challenge. The poorest communities contribute least to greenhouse gas emissions yet bear the greatest burden of climate impacts.\n\nThis issue of Journal ASAP aims to bridge the gap between climate science and poverty research, fostering interdisciplinary dialogue that can inform more equitable and effective policy responses.",
        },
        {
          id: "submissions",
          title: "Call for Submissions",
          body: "Journal ASAP welcomes submissions on all aspects of poverty research. The journal is published under the ISSN 2690-3458 (electronic) and ISSN 2690-3431 (print edition). We particularly encourage submissions from researchers in the Global South and from early-career scholars.\n\nFor submission guidelines and more information, visit the journal website or contact editor@journalasap.org.",
        },
      ],
    },
  },
  {
    slug: "research-illicit-financial-flows",
    img: "/images/research.jpg",
    tag: "Research",
    title: "New Research on Illicit Financial Flows",
    desc: "ASAP members publish groundbreaking research on the scale and impact of illicit financial flows from developing countries, with policy recommendations for stronger international regulation.",
    date: "Posted on 20 Jul 2025",
    author: { img: "", name: "Thomas Pogge" },
    content: {
      intro:
        "New research by ASAP members reveals the staggering scale of illicit financial flows from developing countries and their devastating impact on poverty reduction efforts. The findings underscore the urgent need for stronger international regulation and cooperation.",
      heroImg: "/images/research.jpg",
      sections: [
        {
          id: "key-findings",
          title: "Key Findings",
          body: "The research estimates that developing countries lose over $1 trillion annually through illicit financial flows, including tax evasion, trade misinvoicing, and corruption. These losses far exceed the total amount of foreign aid received by these countries.\n\nThe study demonstrates that illicit financial flows disproportionately affect the poorest countries, undermining their capacity to invest in healthcare, education, and infrastructure.",
        },
        {
          id: "policy-recommendations",
          title: "Policy Recommendations",
          body: "The researchers propose a comprehensive framework for addressing illicit financial flows, including: mandatory public country-by-country reporting by multinational corporations, automatic exchange of tax information between jurisdictions, beneficial ownership transparency for all legal entities, and strengthened capacity for tax administration in developing countries.\n\nThese recommendations align with ASAP's broader advocacy for structural reforms in the global financial system.",
        },
        {
          id: "next-steps",
          title: "Next Steps",
          body: "ASAP is working with partner organizations to bring these findings to the attention of policymakers at national and international levels. The research will be presented at upcoming conferences and shared with civil society organizations working on financial transparency.\n\nWe encourage our members to engage with these findings in their own research and teaching, helping to build the evidence base for meaningful reform.",
        },
      ],
    },
  },
  {
    slug: "impact-interview-poverty-policy-south-asia",
    img: "/images/impact.jpg",
    tag: "Impact",
    title: "Impact Interview: Poverty and Policy in South Asia",
    desc: "A new impact interview explores how academic research can influence poverty policy in South Asia. Featuring insights from leading researchers on turning evidence into action.",
    date: "Posted on 1 Jun 2025",
    author: { img: "", name: "ASAP Editorial" },
    content: {
      intro:
        "In our latest Impact Interview, we explore how academic research can influence poverty policy in South Asia. This conversation with leading researchers sheds light on the challenges and opportunities of turning evidence into action in one of the world's most dynamic regions.",
      heroImg: "/images/impact.jpg",
      sections: [
        {
          id: "the-challenge",
          title: "The Challenge",
          body: "South Asia is home to some of the world's fastest-growing economies, yet hundreds of millions of people remain trapped in poverty. The region faces unique challenges, including rapid urbanization, climate vulnerability, gender inequality, and informal labor markets.\n\nOur interviewees highlight the gap between academic research and policy implementation, noting that rigorous evidence often fails to reach the policymakers who need it most.",
        },
        {
          id: "bridging-the-gap",
          title: "Bridging the Research-Policy Gap",
          body: "The interview explores several successful examples of research influencing policy, including a study on microfinance regulation in Bangladesh that led to improved consumer protections, and a poverty mapping initiative in India that helped target social protection programs more effectively.\n\nKey strategies for bridging the gap include building relationships with policymakers, communicating research in accessible formats, and engaging with civil society organizations that can amplify academic findings.",
        },
        {
          id: "role-of-asap",
          title: "ASAP's Role",
          body: "ASAP's Impact Interview series is designed to promote dialogue about how academics can achieve positive impact through their work. By sharing stories of successful research-policy engagement, we hope to inspire and equip scholars to make their work count.\n\nIf you would like to nominate an impact-oriented academic for a future interview, please contact us. We welcome suggestions from our members and chapters worldwide.",
        },
      ],
    },
  },
  {
    slug: "health-impact-fund-progress-update",
    img: "/images/health.jpg",
    tag: "Health",
    title: "Health Impact Fund: Progress Update",
    desc: "The Health Impact Fund continues its mission to incentivize pharmaceutical innovation for the global poor. New partnerships and pilot programs are expanding access to essential medicines.",
    date: "Posted on 15 May 2025",
    author: { img: "", name: "Thomas Pogge" },
    content: {
      intro:
        "The Health Impact Fund (HIF) continues to make progress in its mission to incentivize the development and delivery of pharmaceutical innovation for the global poor. New partnerships and pilot programs are expanding access to essential medicines in underserved communities.",
      heroImg: "/images/health.jpg",
      sections: [
        {
          id: "how-hif-works",
          title: "How the Health Impact Fund Works",
          body: "HIF proposes a new way to pay for pharmaceutical innovation. Under HIF, pharmaceutical firms would have the option of registering their new medicines with HIF and agreeing to provide them at cost anywhere they are needed. Instead of profiting through drug sales, they would be rewarded based on the global health impact of their drug.\n\nThis approach aligns the incentives of pharmaceutical companies with the health needs of the global poor, ensuring that medicines are developed for diseases that disproportionately affect vulnerable populations.",
        },
        {
          id: "recent-progress",
          title: "Recent Progress",
          body: "Over the past year, HIF has secured new partnerships with research institutions and public health organizations in Africa and South Asia. These partnerships are helping to build the evidence base for HIF's approach and to develop pilot programs that can demonstrate its feasibility.\n\nThe Ubuntu Health Impact Fund, a branch of HIF focused on Africa, aims to make important medicines more available to patients while supporting the pharmaceutical industry on the continent.",
        },
        {
          id: "global-health-impact",
          title: "The Global Health Impact Project",
          body: "The Global Health Impact (GHI) Project complements HIF by evaluating and comparing medicines' health impact around the world. The GHI Index is a rating system that evaluates the health impact of medicines for diseases such as TB, HIV/AIDS, and malaria.\n\nFocusing on need, effectiveness, and accessibility of relevant medicines, the GHI project provides crucial data that can inform both HIF's reward mechanisms and broader global health policy. The project is led by Nicole Hassoun and continues to expand its coverage.",
        },
      ],
    },
  },
]

export function getArticleBySlug(slug: string): Article | undefined {
  return ALL_ARTICLES.find((a) => a.slug === slug)
}

export const TAGS = [
  "All",
  "Essay Prize",
  "Book Awards",
  "Awards",
  "Global Policy",
  "Network",
  "Journal",
  "Research",
  "Impact",
  "Health",
]
