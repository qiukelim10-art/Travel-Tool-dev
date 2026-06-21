"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { languageStorageKey, type Language, useLanguage } from "@/lib/i18n";

type Copy = {
  skipLink: string;
  languageLabel: string;
  languageAria: string;
  hero: {
    label: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
    note: string;
    imageAlt: string;
    stats: Array<{ label: string; value: string }>;
  };
  problem: {
    title: string;
    body: string;
    points: Array<{ title: string; body: string }>;
  };
  modules: {
    title: string;
    body: string;
    screenshots: Array<{ title: string; body: string; image: string; alt: string; wide?: boolean }>;
    items: Array<{ title: string; body: string; wide?: boolean }>;
  };
  flow: {
    title: string;
    body: string;
    steps: Array<{ title: string; body: string }>;
  };
  offer: {
    title: string;
    body: string;
    priceLabel: string;
    price: string;
    priceNote: string;
    refund: string;
    boundariesTitle: string;
    boundaries: string[];
  };
  final: {
    title: string;
    body: string;
    primary: string;
    prepTitle: string;
    prepItems: string[];
    note: string;
  };
};

const pilotCopy: Record<Language, Copy> = {
  zh: {
    skipLink: "跳到主要内容",
    languageLabel: "当前：中文",
    languageAria: "切换语言",
    hero: {
      label: "小团旅行指挥中心",
      title: "把小团旅行从群聊里救出来",
      body:
        "一趟小团旅行，会有行程、预订、预算、打包、文件准备和临时变动。这个私人旅行工作区把这些内容放进一个手机链接里，全组人看到同一份最新安排，少翻聊天记录。",
      primary: "开始手动试点",
      secondary: "看看交付内容",
      note: "公开介绍页只说明服务，不收集资料，不显示私密链接。",
      imageAlt: "抽象的手机旅行工作区预览图，没有真实私密信息",
      stats: [
        { label: "适合人数", value: "2-8 人" },
        { label: "早期价格", value: "新币 4.90" },
        { label: "交付方式", value: "人工搭建" }
      ]
    },
    problem: {
      title: "真正麻烦的是，每个人看到的信息不一样",
      body:
        "小团旅行的资料常常散在群聊、表格、截图和收藏夹里。有人看旧截图，有人翻群聊，有人临出门才问地址和时间。",
      points: [
        {
          title: "群聊会淹没重点",
          body: "酒店地址、车票时间、集合点和付款记录混在聊天里，越接近出发越难找。"
        },
        {
          title: "表格不适合路上临时查",
          body: "手机上要马上看集合点、订单状态或谁先付款时，表格常常太重。"
        },
        {
          title: "截图很快过期",
          body: "航班、预订、打包和文件准备一旦改变，旧截图就开始制造误会。"
        }
      ]
    },
    modules: {
      title: "全组可以用什么",
      body:
        "私人旅行工作区会先搭好基础页面和安全占位内容。大家不用注册账号，打开一个链接就能看到这趟旅行的最新安排。",
      screenshots: [
        {
          title: "今日首页",
          body: "先看下一步、待办事项、路线提醒和紧急信息。",
          image: "/pilot/workspace-today-zh.png",
          alt: "安全示例产品截图：今日首页"
        },
        {
          title: "金额和准备状态",
          body: "分摊、打包和文件准备放在同一处，方便同行的人一起看。",
          image: "/pilot/workspace-money-zh.png",
          alt: "安全示例产品截图：金额和准备状态"
        }
      ],
      items: [
        { title: "今日重点", body: "每个人打开后先看到下一步、待处理事项、金额概览和紧急信息。", wide: true },
        { title: "行程计划", body: "按日期和城市整理移动路线、集合点和当天重点。" },
        { title: "预订清单", body: "酒店、交通、活动和负责人放在一起，大家少来回确认。" },
        { title: "共享金额", body: "记录币种、付款人和分摊对象，让每个人看得懂谁付了什么。", wide: true },
        { title: "打包协作", body: "每个旅伴可以看自己的准备状态，也能知道哪些东西已经有人负责。" },
        { title: "文件准备", body: "全组看到同一份安全清单和提醒，不收护照扫描件，不存敏感文件。" }
      ]
    },
    flow: {
      title: "这个旅行工作区怎么用",
      body:
        "先用目的地、日期和人数搭好基础结构。确认后，一个链接就可以发给同行的人一起看。",
      steps: [
        { title: "提供旅行轮廓", body: "目的地、日期、人数，以及全组最容易搞混的地方。" },
        { title: "工作区先搭好", body: "先放安全占位内容和实用模块，让页面可以马上被检查。" },
        { title: "确认后发给同伴", body: "把非敏感信息补进去，再把一个链接发到群里。" },
        { title: "全组在手机上使用", body: "出发前看准备事项，路上查行程、预订、金额和紧急信息。" }
      ]
    },
    offer: {
      title: "早期试点价和边界",
      body:
        "这个阶段验证的是一整个小团会不会真的打开、看懂并使用这个工作区，不会提前做付款系统、自动生成器或复杂后台。",
      priceLabel: "早期试点",
      price: "新币 4.90",
      priceNote: "人工收款和人工开通。这个页面没有付款链接，也不会提交表单。",
      refund: "如果 7 天内搭建失败、有明显技术问题，或整团用起来不够清楚，可以人工退款。",
      boundariesTitle: "不会做这些",
      boundaries: [
        "不收护照扫描件、证件号码、支付卡、保险文件或私密密码。",
        "不接付款、结账、账单、订阅或自动扣款。",
        "不做人工智能行程生成，也不接付费接口。",
        "不做设置向导、模板市场或公开旅伴资料。"
      ]
    },
    final: {
      title: "想让一趟小团试用，先准备这几项",
      body:
        "联系入口暂时保持手动。这个页面不收资料，下面几项足够判断这趟旅行适不适合做试点。",
      primary: "开始手动试点",
      prepTitle: "请准备",
      prepItems: ["目的地", "日期", "人数", "全组最想先整理的模块"],
      note: "真实联系方式会在对外发送页面前再放上去。"
    }
  },
  en: {
    skipLink: "Skip to main content",
    languageLabel: "Language: English",
    languageAria: "Switch language",
    hero: {
      label: "Group Trip Command Center",
      title: "Get the trip out of the group chat",
      body:
        "A small group trip has plans, bookings, money, packing, document prep, and last-minute changes. The trip workspace puts those moving parts into one mobile link, so everyone sees the latest version without searching the chat.",
      primary: "Start the pilot",
      secondary: "See what you get",
      note: "This public offer page explains the service only. It does not collect data or show private links.",
      imageAlt: "Abstract mobile trip workspace preview without private information",
      stats: [
        { label: "Group size", value: "2-8 people" },
        { label: "Pilot price", value: "SGD 4.90" },
        { label: "Delivery", value: "Manual setup" }
      ]
    },
    problem: {
      title: "The hard part is that everyone sees a different version of the trip.",
      body:
        "Small-group trip details usually sit across chat threads, spreadsheets, screenshots, and saved links. One person checks an old image, another searches the chat, and someone asks for the address right before leaving.",
      points: [
        {
          title: "Chat buries the useful details",
          body: "Hotel addresses, train times, meeting points, and payment notes disappear between casual messages."
        },
        {
          title: "Spreadsheets are heavy on the move",
          body: "When someone needs a meeting point, booking status, or payment note on a phone, a spreadsheet often takes too much effort."
        },
        {
          title: "Screenshots go stale",
          body: "Once a booking, packing list, or document task changes, old screenshots start creating confusion."
        }
      ]
    },
    modules: {
      title: "What the group can use",
      body:
        "The private trip workspace starts with useful pages and safe placeholder content. The group does not need to start from a blank tool or create accounts.",
      screenshots: [
        {
          title: "Today view",
          body: "The first screen shows what happens next, what still needs attention, and where key info lives.",
          image: "/pilot/workspace-today-en.png",
          alt: "Safe product screenshot showing the Today view"
        },
        {
          title: "Money and prep status",
          body: "Shared money notes, packing status, and document prep stay visible to the group.",
          image: "/pilot/workspace-money-en.png",
          alt: "Safe product screenshot showing money and prep status"
        }
      ],
      items: [
        { title: "Today", body: "Everyone can see the next step, open tasks, money snapshot, and emergency info first.", wide: true },
        { title: "Plan", body: "A practical date and city structure for movements, meeting points, and key moments." },
        { title: "Bookings", body: "Accommodation, transport, activities, owners, and status in one shared place." },
        { title: "Money", body: "Currencies, payer, split members, and settlement notes that everyone can understand.", wide: true },
        { title: "Packing", body: "Each traveler can see their own prep status and what the group has already covered." },
        { title: "Documents", body: "Safe preparation checklist only. No passport scans, sensitive files, or private vault claims." }
      ]
    },
    flow: {
      title: "How to use this trip workspace",
      body:
        "The workspace starts from the destination, dates, and group size. Once the basic structure is checked, one link can be shared with the group.",
      steps: [
        { title: "Share the trip shape", body: "Destination, dates, group size, and the part that feels most confusing for the group." },
        { title: "The workspace is set up", body: "Safe starter content and practical modules make the page reviewable right away." },
        { title: "Check it and share", body: "Replace placeholders with non-sensitive details, then send one link to the group." },
        { title: "The group uses it", body: "Before and during the trip, everyone can check the plan, bookings, money, packing, and emergency info on mobile." }
      ]
    },
    offer: {
      title: "Pilot price and boundaries",
      body:
        "This stage tests whether a real small group will open, understand, and use the workspace. It does not include checkout, automation, or a complex admin system.",
      priceLabel: "Early pilot",
      price: "SGD 4.90",
      priceNote: "Manual payment and manual onboarding only. There is no checkout link and no form on this page.",
      refund: "Manual 7-day refund if setup fails, has clear technical issues, or is not clear enough for the group.",
      boundariesTitle: "Not included",
      boundaries: [
        "No passport scans, identity numbers, payment cards, insurance files, or private passcodes.",
        "No checkout, billing, subscriptions, or automatic payment collection.",
        "No AI itinerary generation and no paid API dependency.",
        "No setup wizard, template marketplace, or public traveler data."
      ]
    },
    final: {
      title: "To try it with a small group, prepare these first",
      body:
        "Contact stays manual for now. Nothing is submitted on this page. These details are enough to check whether the trip fits the pilot.",
      primary: "Start the manual pilot",
      prepTitle: "Prepare",
      prepItems: ["Destination", "Dates", "Group size", "Part the group wants organized first"],
      note: "Real contact details can be added before this page is sent to prospects."
    }
  }
};

export function PilotOfferClient() {
  const { language, setLanguage } = useLanguage();
  const [pilotLanguage, setPilotLanguage] = useState<Language>("zh");
  const copy = pilotCopy[pilotLanguage];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    const nextLanguage: Language = storedLanguage === "en" ? "en" : "zh";

    setPilotLanguage(nextLanguage);
    if (language !== nextLanguage) {
      setLanguage(nextLanguage);
    }
  }, [language, setLanguage]);

  function switchLanguage() {
    const nextLanguage: Language = pilotLanguage === "zh" ? "en" : "zh";
    setPilotLanguage(nextLanguage);
    setLanguage(nextLanguage);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f1] text-ink">
      <a href="#pilot-main" className="skip-link">
        {copy.skipLink}
      </a>

      <header className="border-b border-ink/10 bg-[#f9fbf6]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#pilot-main" className="min-w-0 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route">
            {copy.hero.label}
          </a>
          <button
            type="button"
            onClick={switchLanguage}
            aria-label={copy.languageAria}
            className="shrink-0 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-route hover:text-route focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route"
          >
            {copy.languageLabel}
          </button>
        </div>
      </header>

      <section className="overflow-hidden border-b border-ink/10 bg-[#f9fbf6]">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)] md:items-center md:py-12">
          <div id="pilot-main" className="min-w-0">
            <p className="text-sm font-semibold text-route">{copy.hero.label}</p>
            <h1 className="mt-4 max-w-4xl break-words text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl break-words text-base leading-7 text-zinc-700 sm:text-lg">
              {copy.hero.body}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {copy.hero.stats.map((stat) => (
                <StatTile key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#manual-pilot"
                className="inline-flex min-h-11 max-w-full items-center justify-center whitespace-nowrap rounded-md bg-moss px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-route focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route"
              >
                {copy.hero.primary}
              </a>
              <a
                href="#deliverables"
                className="inline-flex min-h-11 max-w-full items-center justify-center whitespace-nowrap rounded-md border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-route hover:text-route focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route"
              >
                {copy.hero.secondary}
              </a>
            </div>

            <p className="mt-4 max-w-2xl text-xs leading-5 text-zinc-500">{copy.hero.note}</p>
          </div>

          <figure className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-route/15 bg-white shadow-soft">
              <Image
                src="/pilot/command-center-preview.png"
                alt={copy.hero.imageAlt}
                width={1600}
                height={1000}
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
                className="h-auto w-full"
              />
            </div>
          </figure>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 md:grid-cols-[0.86fr_1.14fr] md:py-14">
          <div className="min-w-0">
            <SectionTitle>{copy.problem.title}</SectionTitle>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-700 sm:text-base">{copy.problem.body}</p>
          </div>
          <div className="grid gap-3">
            {copy.problem.points.map((point, index) => (
              <article
                key={point.title}
                className={index === 1 ? "rounded-lg border border-ink/10 bg-[#f5f8f5] p-4 shadow-soft md:ml-8" : "rounded-lg border border-ink/10 bg-[#fdfbf5] p-4 shadow-soft"}
              >
                <h3 className="break-words text-lg font-semibold text-ink">{point.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="deliverables" className="border-b border-ink/10 bg-[#eef5f1]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="grid gap-5 md:grid-cols-[0.72fr_1.28fr] md:items-end">
            <SectionTitle>{copy.modules.title}</SectionTitle>
            <p className="max-w-3xl text-sm leading-6 text-zinc-700 sm:text-base">{copy.modules.body}</p>
          </div>

          <div className="mt-7 grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
            {copy.modules.screenshots.map((screenshot, index) => (
              <figure
                key={screenshot.image}
                className={index === 0 ? "min-w-0 rounded-lg border border-route/15 bg-white p-3 shadow-soft lg:row-span-2" : "min-w-0 rounded-lg border border-route/15 bg-white p-3 shadow-soft"}
              >
                <div className="overflow-hidden rounded-md border border-ink/10 bg-[#f6faf7]">
                  <Image
                    src={screenshot.image}
                    alt={screenshot.alt}
                    width={1200}
                    height={760}
                    sizes="(min-width: 1024px) 44vw, 100vw"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="px-1 pb-1 pt-3">
                  <h3 className="break-words text-lg font-semibold text-ink">{screenshot.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{screenshot.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-6">
            {copy.modules.items.map((item) => (
              <article
                key={item.title}
                className={item.wide ? "min-w-0 rounded-lg border border-route/15 bg-white p-4 shadow-soft md:col-span-4" : "min-w-0 rounded-lg border border-route/15 bg-white p-4 shadow-soft md:col-span-2"}
              >
                <h3 className="break-words text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="manual-pilot" className="border-b border-ink/10 bg-[#fffdf8]">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-14">
          <div className="min-w-0">
            <SectionTitle>{copy.flow.title}</SectionTitle>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-700 sm:text-base">{copy.flow.body}</p>
          </div>
          <ol className="grid gap-3">
            {copy.flow.steps.map((step, index) => (
              <li key={step.title} className="grid gap-3 rounded-lg border border-ink/10 bg-white p-4 shadow-soft sm:grid-cols-[2.75rem_1fr]">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sky text-sm font-semibold text-signal">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-lg font-semibold text-ink">{step.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-14">
          <article className="rounded-lg border border-route/15 bg-[#edf7f4] p-5 shadow-soft">
            <p className="text-sm font-semibold text-route">{copy.offer.priceLabel}</p>
            <h2 className="mt-3 break-words text-4xl font-semibold text-ink sm:text-5xl">{copy.offer.price}</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-700 sm:text-base">{copy.offer.priceNote}</p>
            <p className="mt-4 rounded-md border border-route/15 bg-white px-3 py-3 text-sm leading-6 text-zinc-700">
              {copy.offer.refund}
            </p>
          </article>

          <article className="rounded-lg border border-ink/10 bg-[#fdfbf5] p-5 shadow-soft">
            <SectionTitle>{copy.offer.title}</SectionTitle>
            <p className="mt-4 text-sm leading-6 text-zinc-700 sm:text-base">{copy.offer.body}</p>
            <h3 className="mt-6 text-base font-semibold text-ink">{copy.offer.boundariesTitle}</h3>
            <ul className="mt-3 grid gap-2">
              {copy.offer.boundaries.map((boundary) => (
                <li key={boundary} className="border-l-4 border-amberline bg-white px-3 py-2 text-sm leading-6 text-zinc-700">
                  {boundary}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="bg-[#10231f] text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1fr_0.85fr] md:items-center md:py-14">
          <div className="min-w-0">
            <h2 className="max-w-3xl break-words text-3xl font-semibold leading-tight sm:text-4xl">{copy.final.title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{copy.final.body}</p>
            <a
              href="#manual-pilot"
              className="mt-6 inline-flex min-h-11 max-w-full items-center justify-center whitespace-nowrap rounded-md bg-[#f2c66d] px-5 py-3 text-sm font-semibold text-[#10231f] transition-colors hover:bg-[#ffd98b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {copy.final.primary}
            </a>
            <p className="mt-4 max-w-2xl text-xs leading-5 text-white/60">{copy.final.note}</p>
          </div>

          <aside className="rounded-lg border border-white/18 bg-white/8 p-5">
            <h3 className="text-base font-semibold text-white">{copy.final.prepTitle}</h3>
            <ul className="mt-4 grid gap-2">
              {copy.final.prepItems.map((item) => (
                <li key={item} className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white">
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="break-words text-3xl font-semibold leading-tight text-ink sm:text-4xl">{children}</h2>;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-ink/10 bg-white px-2 py-2 shadow-soft sm:px-3 sm:py-3">
      <p className="text-[0.68rem] font-semibold leading-4 text-zinc-500 sm:text-xs">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-5 text-ink sm:text-lg">{value}</p>
    </div>
  );
}
