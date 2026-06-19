export interface FAQItem {
  question: string;
  answerHtml: string;
  answerText: string;
}

export const faqItems: FAQItem[] = [
  {
    question: 'What is a FIRE calculator?',
    answerHtml: 'A FIRE calculator is a free online tool that estimates how much money you need to achieve Financial Independence and Retire Early. It projects your retirement timeline based on your age, income, savings rate, annual expenses, and expected investment returns. Our calculator supports <b>Lean FIRE</b>, <b>Regular FIRE</b>, <b>Fat FIRE</b>, <b>Coast FIRE</b>, and <b>Barista FIRE</b> strategies, with interactive charts and instant results.',
    answerText: 'A FIRE calculator is a free online tool that estimates how much money you need to achieve Financial Independence and Retire Early. It projects your retirement timeline based on your age, income, savings rate, annual expenses, and expected investment returns. Our calculator supports Lean FIRE, Regular FIRE, Fat FIRE, Coast FIRE, and Barista FIRE strategies, with interactive charts and instant results.',
  },
  {
    question: 'What are the different FIRE strategies?',
    answerHtml: 'The five main FIRE strategies are:\n<ul><li><b>Lean FIRE</b> — Minimalist lifestyle on $25K–$40K/year. Target: 20× annual expenses.</li><li><b>Regular FIRE</b> — Comfortable middle-class retirement. Target: 25× annual expenses.</li><li><b>Fat FIRE</b> — Luxury lifestyle with higher spending. Target: 30× annual expenses.</li><li><b>Coast FIRE</b> — Saved enough that compound interest alone reaches your goal by 65. No additional contributions needed.</li><li><b>Barista FIRE</b> — Part-time work covers some expenses; investments cover the rest.</li></ul>Each strategy targets a different balance between savings effort and retirement lifestyle.',
    answerText: 'The five main FIRE strategies are: Lean FIRE (minimalist lifestyle on $25K–$40K/year, target 20× expenses), Regular FIRE (comfortable middle-class retirement, target 25× expenses), Fat FIRE (luxury lifestyle, target 30× expenses), Coast FIRE (compound interest alone reaches your goal by 65—no extra contributions needed), and Barista FIRE (part-time work covers some expenses while investments cover the rest).',
  },
  {
    question: 'How do I calculate my FIRE number?',
    answerHtml: 'Use this formula:<br /><b>FIRE Number = Annual Retirement Expenses × Multiplier</b><br /><br />The multiplier depends on your strategy:<ul><li><b>20×</b> for Lean FIRE</li><li><b>25×</b> for Regular FIRE</li><li><b>30×</b> for Fat FIRE</li></ul><b>Example:</b> If you need $50,000/year, your Regular FIRE number is $50,000 × 25 = <b>$1,250,000</b>. The 25× multiplier assumes a 4% safe withdrawal rate, meaning your portfolio should sustain 30+ years of withdrawals.',
    answerText: '<strong>Formula:</strong> FIRE Number = Annual Retirement Expenses × Multiplier. Use 20× for Lean FIRE, 25× for Regular FIRE, or 30× for Fat FIRE. <strong>Example:</strong> If you need $50,000/year, your Regular FIRE number is $50,000 × 25 = $1,250,000. The 25× multiplier assumes a 4% safe withdrawal rate, meaning your portfolio should sustain 30+ years of withdrawals.',
  },
  {
    question: 'What is a Coast FIRE calculator and how does it work?',
    answerHtml: 'A Coast FIRE calculator determines the age when your current portfolio—growing at expected returns with <b>zero additional contributions</b>—will reach your retirement number by age 65. <b>How it works:</b> It compounds your existing balance forward using your expected rate of return, then calculates the crossover point where projected growth meets your target. Once you hit Coast FIRE, you only need to earn enough to cover current living expenses. No more aggressive saving required.',
    answerText: 'A Coast FIRE calculator determines the age when your current portfolio—growing at expected returns with zero additional contributions—will reach your retirement number by age 65. It compounds your existing balance forward, then finds the crossover point where projected growth meets your target. Once you hit Coast FIRE, you only need to earn enough to cover current living expenses.',
  },
  {
    question: 'When can I retire using a FIRE calculator?',
    answerHtml: 'A FIRE calculator shows your exact retirement date by projecting portfolio growth year-by-year. Enter your <b>current age</b>, <b>target retirement age</b>, <b>annual income</b>, <b>savings rate</b>, <b>annual expenses</b>, and <b>expected returns</b>. The calculator then displays the year you will reach financial independence. Adjust any input to see how it shifts your timeline—increasing your savings rate from 20% to 40% can cut years off your journey.',
    answerText: 'Enter your current age, target retirement age, annual income, savings rate, annual expenses, and expected returns. The calculator projects portfolio growth year-by-year and displays the exact year you will reach financial independence. Adjust any input to see how it shifts your timeline—increasing your savings rate from 20% to 40% can cut years off your journey.',
  },
  {
    question: 'What should I look for in the best FIRE calculator?',
    answerHtml: 'The best FIRE calculator should offer:<ul><li><b>Multiple strategies</b> — Lean, Regular, Fat, Coast, and Barista FIRE</li><li><b>Interactive charts</b> — Visualize portfolio growth over time</li><li><b>Scenario comparison</b> — Test different savings rates or retirement ages side by side</li><li><b>Privacy</b> — No data collection, all calculations in-browser</li><li><b>PDF export</b> — Download your plan for offline review</li><li><b>Shareable links</b> — Send your projection to a partner or advisor</li></ul>Our free calculator includes all of these features with no signup required.',
    answerText: 'The best FIRE calculator should offer: multiple strategies (Lean, Regular, Fat, Coast, Barista), interactive charts to visualize growth, scenario comparison to test different variables side by side, privacy with all calculations in-browser, PDF export for offline review, and shareable links. Our free calculator includes all of these with no signup required.',
  },
  {
    question: 'What is the 25x rule for FIRE?',
    answerHtml: 'The 25x rule says you need to save <b>25 times your annual expenses</b> to retire early. It is derived from the 4% safe withdrawal rate: if you withdraw 4% of your portfolio each year, historical data shows it should last at least 30 years.<br /><br /><b>Example:</b> Spend $40,000/year → need $1,000,000 invested. Spend $80,000/year → need $2,000,000. This is the baseline for <b>Regular FIRE</b>. Lean FIRE uses 20×; Fat FIRE uses 30×.',
    answerText: 'The 25x rule says you need to save 25 times your annual expenses to retire early. It derives from the 4% safe withdrawal rate: withdrawing 4% annually should sustain your portfolio for 30+ years. <strong>Example:</strong> Spend $40,000/year → need $1,000,000. Spend $80,000/year → need $2,000,000. This is the baseline for Regular FIRE. Lean FIRE uses 20×; Fat FIRE uses 30×.',
  },
  {
    question: 'What is the 4% rule for FIRE?',
    answerHtml: 'The 4% rule states you can safely withdraw <b>4% of your portfolio annually</b> in retirement without depleting your savings over a 30-year period. It comes from the <b>Trinity Study</b>, which analyzed historical stock and bond returns. <b>Example:</b> With a $1,250,000 portfolio, you withdraw $50,000/year (4%). Adjusted annually for inflation, this strategy has historically succeeded in over 95% of 30-year periods.',
    answerText: 'The 4% rule states you can safely withdraw 4% of your portfolio annually in retirement without depleting savings over 30 years. It comes from the Trinity Study, which analyzed historical stock and bond returns. <strong>Example:</strong> With a $1,250,000 portfolio, you withdraw $50,000/year (4%), adjusted annually for inflation. This strategy historically succeeds in over 95% of 30-year periods.',
  },
  {
    question: 'What is the 30/30/30/10 rule for retirement savings?',
    answerHtml: 'The 30/30/30/10 rule is a budgeting framework for FIRE savers:<ul><li><b>30%</b> — Housing (mortgage, rent, taxes, insurance)</li><li><b>30%</b> — Living expenses (food, transport, utilities)</li><li><b>30%</b> — Savings and investments (your FIRE engine)</li><li><b>10%</b> — Insurance, emergencies, and miscellaneous</li></ul>This allocation ensures you save aggressively while maintaining a sustainable lifestyle. Hitting 30% savings rate puts you on track for early retirement in roughly 25 years.',
    answerText: 'The 30/30/30/10 rule is a budgeting framework for FIRE savers: 30% to housing (mortgage, rent, taxes, insurance), 30% to living expenses (food, transport, utilities), 30% to savings and investments (your FIRE engine), and 10% to insurance, emergencies, and miscellaneous. Hitting a 30% savings rate puts you on track for early retirement in roughly 25 years.',
  },
  {
    question: 'How much do I need to coast FIRE at 35?',
    answerHtml: 'To coast FIRE at 35, you need enough saved so compound interest alone reaches your FIRE number by your target retirement age. <b>Example:</b> With $60,000/year expenses, your FIRE number is $1,500,000 (25×). If you plan to retire at 55 (20 years) and earn 7% annually, your Coast FIRE number is $1,500,000 / (1.07)<sup>20</sup> = <b>$389,000</b>. Once you save $389K by age 35, you can stop aggressive saving — compound interest grows it to $1.5M by 55.',
    answerText: 'To coast FIRE at 35, calculate your FIRE number (annual expenses × 25), then discount it by your expected returns over the years until retirement. Example: $60K expenses → $1.5M FIRE number. At 7% returns with 20 years to retirement, you need $389,000 saved by 35.',
  },
  {
    question: 'What is the Coast FIRE number formula?',
    answerHtml: 'The Coast FIRE number formula is:<br /><b>Coast FIRE Number = FIRE Number / (1 + Return Rate)<sup>Years to Retirement</sup></b><br /><br />Where FIRE Number = Annual Expenses × 25 (for the 4% rule). <b>Example:</b> $80,000/year expenses → $2M FIRE number. 30 years to retirement at 7%: $2M / (1.07)<sup>30</sup> = <b>$263,000</b>. Save $263K and let compound interest do the rest.',
    answerText: 'Coast FIRE Number = FIRE Number / (1 + Return Rate)^Years to Retirement. FIRE Number = Annual Expenses × 25. Example: $80K expenses → $2M FIRE number. At 7% with 30 years, you need $263K saved.',
  },
  {
    question: 'What is Barista FIRE and how does it work?',
    answerHtml: '<b>Barista FIRE</b> (Financial Independence, Retire Early) is a hybrid approach where you save enough investments to cover <b>most</b> of your living expenses, then work a part-time job to cover the rest. The name comes from the idea of working as a barista — a low-stress job that often provides health insurance benefits.<br /><br />The math is simple: instead of needing your portfolio to cover 100% of expenses, you only need it to cover the gap between your expenses and your part-time income. This dramatically reduces the savings required and lets you reach financial freedom years sooner.',
    answerText: 'Barista FIRE is a hybrid approach where you save enough to cover most expenses, then work part-time to cover the rest. Your portfolio only needs to cover the gap between expenses and part-time income, dramatically reducing the savings required.',
  },
  {
    question: 'How is the Barista FIRE number calculated?',
    answerHtml: 'The Barista FIRE formula is:<br /><br /><b>Barista FIRE Number = (Annual Expenses − Part-Time Annual Income) × 25</b><br /><br />This uses the same 4% safe withdrawal rule as traditional FIRE, but applied only to the "gap" — the amount your investments need to cover after part-time income.<br /><br /><b>Example:</b> If you spend $50,000/year and earn $20,000/year part-time:<br />• Gap: $50,000 − $20,000 = <b>$30,000</b><br />• Barista FIRE Number: $30,000 × 25 = <b>$750,000</b><br />• Traditional FIRE Number: $50,000 × 25 = <b>$1,250,000</b><br />• <b>Savings:</b> $500,000 less needed!',
    answerText: 'Barista FIRE Number = (Annual Expenses − Part-Time Annual Income) × 25. Example: $50K expenses − $20K part-time = $30K gap × 25 = $750K needed. That is $500K less than traditional FIRE at $1.25M.',
  },
  {
    question: 'How much less do I need for Barista FIRE vs Regular FIRE?',
    answerHtml: 'The amount you save depends entirely on your part-time income. Every dollar you earn part-time reduces your FIRE number by <b>$25</b> (the 25x multiplier).<br /><br /><b>Examples on $50,000 annual expenses:</b><br />• $0 part-time (Regular FIRE): $1,250,000 needed<br />• $10,000 part-time ($833/mo): $1,000,000 needed ($250K less)<br />• $20,000 part-time ($1,667/mo): $750,000 needed ($500K less)<br />• $30,000 part-time ($2,500/mo): $500,000 needed ($750K less)<br />• $40,000 part-time ($3,333/mo): $250,000 needed ($1M less)<br /><br />As you can see, even modest part-time income dramatically reduces the savings required. A $2,000/month barista job shaves $600,000 off your target.',
    answerText: 'Every dollar in part-time income reduces your FIRE number by $25 (25x multiplier). On $50K expenses: $833/mo part-time saves $250K. $1,667/mo saves $500K. $2,500/mo saves $750K. Even a modest barista job dramatically reduces what you need to save.',
  },
  {
    question: 'What are the best Barista FIRE jobs?',
    answerHtml: 'The best Barista FIRE jobs share three qualities: they are <b>enjoyable</b>, <b>flexible</b>, and often provide <b>health insurance benefits</b>. Popular options include:<br /><br /><ul><li><b>Barista / Coffee shop</b> ($1,500–$2,500/mo) — The namesake job. Social, flexible, often with health benefits at chains like Starbucks.</li><li><b>Retail associate</b> ($2,000–$3,000/mo) — Part-time at stores like REI, Apple, or local shops. Employee discounts included.</li><li><b>Freelancing / Consulting</b> ($2,000–$8,000/mo) — Leverage your professional skills on your own terms.</li><li><b>Property management</b> ($1,500–$4,000/mo) — Manage a few rental units for reduced rent + income.</li><li><b>Teaching / Tutoring</b> ($1,500–$3,500/mo) — Teach what you love at community colleges or online.</li><li><b>Dog walking / Pet sitting</b> ($1,000–$3,000/mo) — Low stress, outdoors, and in high demand.</li><li><b>National Park / Ski resort work</b> ($1,500–$3,000/mo) — Combine work with your dream location.</li></ul>',
    answerText: 'Best Barista FIRE jobs: barista/coffee shop ($1.5K–$2.5K/mo), retail ($2K–$3K/mo), freelancing ($2K–$8K/mo), property management, teaching/tutoring, dog walking, and national park or ski resort work. Look for jobs with health benefits.',
  },
  {
    question: 'How does inflation affect my Barista FIRE plan?',
    answerHtml: 'Inflation is built into this calculator. The calculation subtracts the inflation rate from your expected investment returns to give an <b>inflation-adjusted</b> projection. All numbers are shown in today\'s dollars.<br /><br />However, Barista FIRE has a unique inflation advantage: your part-time income will likely <b>increase with inflation</b> over time. Minimum wages rise, freelance rates adjust, and Social Security COLAs track inflation. This means your part-time income provides a natural inflation hedge that pure investment withdrawal strategies lack.<br /><br />For safety, we recommend using a <b>conservative 7% return</b> and <b>3% inflation</b> assumption, which gives a 4% real return — aligned with the Trinity Study\'s findings.',
    answerText: 'Inflation is built into the calculator (returns minus inflation). Barista FIRE has an inflation advantage: your part-time income likely rises with inflation (minimum wage increases, rate adjustments), providing a natural hedge. Use conservative 7% return and 3% inflation assumptions.',
  },
  {
    question: 'Can I switch from Barista FIRE to full retirement?',
    answerHtml: 'Absolutely. Barista FIRE is often used as a <b>bridge strategy</b> to full FIRE. Here is how it works:<br /><br /><ol><li><b>Phase 1 — Accumulation:</b> Save aggressively while working full-time.</li><li><b>Phase 2 — Barista FIRE:</b> Switch to part-time work. Your portfolio continues growing (slower, since you are not adding much), while your part-time income covers some expenses.</li><li><b>Phase 3 — Full FIRE:</b> Once your portfolio reaches your traditional FIRE number (25× full expenses), you can stop working entirely.</li></ol><br />Many people find they enjoy their Barista FIRE lifestyle so much they never transition to full retirement. The flexibility is the point — you have options, which is what financial independence is all about.',
    answerText: 'Yes. Barista FIRE is a bridge to full FIRE. Phase 1: accumulate aggressively. Phase 2: switch to part-time, portfolio still grows. Phase 3: once portfolio reaches 25× full expenses, stop working entirely. Many people enjoy the Barista phase so much they never fully retire.',
  },
  {
    question: 'What is the 3-6-9 rule of money?',
    answerHtml: 'The 3-6-9 rule is a graduated emergency fund strategy:<ul><li><b>3 months</b> of expenses — minimum safety net</li><li><b>6 months</b> — stable financial foundation</li><li><b>9–12 months</b> — complete security before aggressive FIRE investing</li></ul>Build your emergency fund in stages. Start with 3 months, then redirect that saving power toward investments. A fully funded 9-month buffer protects against job loss, medical emergencies, or market downturns while you pursue early retirement.',
    answerText: 'The 3-6-9 rule is a graduated emergency fund strategy: build to 3 months of expenses first (minimum safety net), then 6 months (stable foundation), then 9–12 months (complete security before aggressive FIRE investing). Start with 3 months, then redirect that saving power toward investments. A fully funded 9-month buffer protects against job loss, medical emergencies, or market downturns.',
  },
];
