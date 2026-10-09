import { useState } from 'react';

const API_URL = 'http://localhost:5001';

export default function LoginPage({ onLogin, onSwitchToSignup }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Login failed.');
            }

            localStorage.setItem('phantomSoulToken', result.token);

            onLogin(result);
        } catch (err) {
            setError(err.message || 'Unable to connect to PhantomSoul.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#08090D] text-[#E7E9EF] flex items-center justify-center px-6 relative overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7C5CFC]/10 rounded-full blur-[140px]" />

            <div className="relative w-full max-w-md">

                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="text-xs tracking-[0.35em] text-[#7C5CFC] mb-3">
                        PHANTOM_SOUL // OS_v1.0
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight">
                        Welcome back.
                    </h1>

                    <p className="text-sm text-[#8B91A1] mt-2">
                        Access your investment intelligence system.
                    </p>
                </div>

                {/* Login panel */}
                <div className="bg-[#0F1118]/95 border border-[#252936] rounded-xl p-7 shadow-2xl">

                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />

                        <span className="text-xs tracking-widest text-[#8B91A1] uppercase">
                            Secure authentication
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#8B91A1] mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@firm.com"
                                autoComplete="email"
                                required
                                className="w-full bg-[#08090D] border border-[#252936] rounded-lg px-4 py-3 text-sm outline-none transition focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40 placeholder:text-[#4D5260]"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#8B91A1] mb-2">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                className="w-full bg-[#08090D] border border-[#252936] rounded-lg px-4 py-3 text-sm outline-none transition focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40 placeholder:text-[#4D5260]"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="border border-[#F87171]/30 bg-[#F87171]/5 rounded-lg px-4 py-3 text-sm text-[#F87171]">
                                {error}
                            </div>
                        )}

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-[#7C5CFC] text-white text-sm font-medium tracking-wide transition hover:bg-[#6D4DE8] hover:shadow-[0_0_25px_rgba(124,92,252,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'AUTHENTICATING...' : 'ENTER PHANTOMSOUL'}
                        </button>
                    </form>

                    {/* Signup */}
                    <div className="mt-6 pt-6 border-t border-[#252936] text-center">

                        <p className="text-sm text-[#8B91A1] mb-3">
                            Don't have an account?
                        </p>

                        {/* Physical signup button */}
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            className="w-full py-3 rounded-lg border border-[#38BDF8] bg-[#38BDF8]/5 text-[#38BDF8] text-sm font-medium tracking-wide transition hover:bg-[#38BDF8]/10 hover:border-[#38BDF8] hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                        >
                            CREATE OPERATIVE ACCOUNT →
                        </button>

                    </div>
                </div>

                {/* System footer */}
                <div className="flex justify-between mt-4 text-[10px] tracking-widest text-[#4D5260] uppercase">
                    <span>
                        SYSTEM: ONLINE
                    </span>

                    <span className="text-[#34D399]">
                        ENCRYPTION: ACTIVE
                    </span>
                </div>

                <div className="text-center mt-5 text-[10px] tracking-widest text-[#4D5260] uppercase">
                    Decision intelligence • Wealth • Strategy
                </div>
            </div>
        </div>
    );
}
