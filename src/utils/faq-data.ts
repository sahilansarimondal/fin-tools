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
    question: 'What is the 3-6-9 rule of money?',
    answerHtml: 'The 3-6-9 rule is a graduated emergency fund strategy:<ul><li><b>3 months</b> of expenses — minimum safety net</li><li><b>6 months</b> — stable financial foundation</li><li><b>9–12 months</b> — complete security before aggressive FIRE investing</li></ul>Build your emergency fund in stages. Start with 3 months, then redirect that saving power toward investments. A fully funded 9-month buffer protects against job loss, medical emergencies, or market downturns while you pursue early retirement.',
    answerText: 'The 3-6-9 rule is a graduated emergency fund strategy: build to 3 months of expenses first (minimum safety net), then 6 months (stable foundation), then 9–12 months (complete security before aggressive FIRE investing). Start with 3 months, then redirect that saving power toward investments. A fully funded 9-month buffer protects against job loss, medical emergencies, or market downturns.',
  },
];
