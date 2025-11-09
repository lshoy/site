export const siteConfig = {
  name: "larryshoyfer.com",
  title: "Larry Shoyfer Writings",
  description:
    "Philosopher; modern-day culture, politics, pain, etc.",
  url: "https://larryshoyfer.com",
  author: {
    name: "Larry Shoyfer",
    email: "lshoyfer@icloud.com",
    social: {
      x: "https://x.com/larryshoyfer",
    },
  },
  navigation: [
    { label: "Home", href: "/" },
    { label: "Writings", href: "/writings" },
  ],
  hero: {
    lines: [
      "'ARTIFICES DEDICATED TO YE! & FRANK YANG. & ROBERT PELLONI!'", 
      "'EDIFICES DEDICATED TO FRIEDRICH NIETZSCHE.' - FUCK YOU! / LOVE YOU!",
      "'SOME OF MY PAIN IS DEDICATED TO NICHOLAS J. FUENTES!'",
      "'AS IN, I LIKE HIM! AS IN, NICHOLAS J. FUENTES, TO REMOVE AMBIGUITY!'",
    ],
    images: [
      {
        src: "/cc.png",
        alt: "Titties out C.C. from Code Geass with cuts and blood on her arm. AI generated.",
        width: 160,
        height: 160,
      },
      {
        src: "/cc2.png",
        alt: "C.C. from Code Geass bloodily stabbing her right breast with her right arm with a knife. Self-harm cuts and blood visible on her right arm. AI generated.",
        width: 160,
        height: 160,
      },
      {
        src: "/me.jpeg",
        alt: "Me with a knife, painting a strange picture that I really am self-aware of enough to not; yet it must be done.",
        width: 160,
        height: 160,
      },
      {
        src: "/me2.jpeg",
        alt: "Me 2.",
        width: 160,
        height: 160,
      },
    ],
  },
  footer: {
    note: "What's the point in wittiness? Oh, right. 'Gay.' Yeah. Writing is gay isn't it? The fact that it's a site, is just awful, isn't it?",
  },
};

export type SiteConfig = typeof siteConfig;
