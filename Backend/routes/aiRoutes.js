import express from 'express';
import OpenAI from 'openai';

import Portfolio from '../models/Portfolio.js';
import { verifyCRFTToken } from '../middleware/authMiddleware.js';
import { recordAudit } from '../utils/auditLogger.js';

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


router.post(
    '/portfolio/analyze',
    verifyCRFTToken,
    async (req, res) => {
        try {
            const portfolio = await Portfolio.findOne({
                userId: req.user._id,
            });

            if (!portfolio || portfolio.holdings.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Portfolio does not contain any holdings',
                });
            }

            const holdings = portfolio.holdings.map((holding) => ({
                symbol: holding.symbol,
                name: holding.name,
                assetType: holding.assetType,
                quantity: holding.quantity,
                purchasePrice: holding.purchasePrice,
                accountType: holding.accountType,
            }));

            const prompt = `
You are PhantomSoul, an investment intelligence and behavioral-risk
analysis system.

You are NOT the user's financial advisor and must not make decisions
for the user.

Analyze the following portfolio.

PORTFOLIO:
${JSON.stringify(holdings, null, 2)}

Analyze:

1. Asset-class concentration
2. Individual-position concentration
3. Potential diversification issues
4. Potential cognitive biases
5. Questions the investor should investigate
6. Data or assumptions that may need verification

Do NOT tell the user to buy, sell, or hold a specific security.

Separate observable portfolio facts from analytical observations.

Return your response in this structure:

PORTFOLIO SNAPSHOT
...

CONCENTRATION
...

DIVERSIFICATION
...

BEHAVIORAL CHECK
...

QUESTIONS TO INVESTIGATE
...

DATA LIMITATIONS
...
`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are PhantomSoul, a disciplined portfolio intelligence engine focused on evidence, uncertainty, and cognitive-bias detection.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.2,
            });

            const analysis =
                completion.choices[0]?.message?.content || '';

            await recordAudit({
                userId: req.user._id,
                action: 'AI_PORTFOLIO_ANALYSIS',
                resource: 'portfolio',
                ipAddress: req.ip,
            });

            return res.json({
                success: true,
                data: {
                    analysis,
                    generatedAt: new Date().toISOString(),
                },
            });
        } catch (error) {
            console.error('[AI PORTFOLIO ERROR]:', error.message);

            return res.status(500).json({
                success: false,
                error: 'AI portfolio analysis failed',
            });
        }
    }
);

export default router;
