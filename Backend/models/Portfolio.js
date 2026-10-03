import mongoose from 'mongoose';

const HoldingSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        assetType: {
            type: String,
            enum: [
                'EQUITY',
                'ETF',
                'MUTUAL_FUND',
                'BOND',
                'TREASURY',
                'CRYPTO',
                'CASH',
                'REAL_ESTATE',
                'RETIREMENT_ACCOUNT',
                'ALTERNATIVE',
                'OTHER',
            ],
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
        },

        purchasePrice: {
            type: Number,
            required: true,
            min: 0,
        },

        purchaseDate: {
            type: Date,
            required: true,
        },

        accountType: {
            type: String,
            enum: [
                'BROKERAGE',
                'RETIREMENT',
                '401K',
                'IRA',
                'ROTH_IRA',
                'BANK',
                'OTHER',
            ],
            default: 'BROKERAGE',
        },

        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const PortfolioSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },

        holdings: {
            type: [HoldingSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Portfolio', PortfolioSchema);
