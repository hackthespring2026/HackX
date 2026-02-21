<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DDCETPrepHub – Your Preparation Partner</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, .brand { font-family: 'Sora', sans-serif; }
        body { background-color: #F8FAFC; }

        .hero-bg {
            background: linear-gradient(135deg, #0f172a 0%, #1E3A8A 40%, #0e4f72 70%, #0f172a 100%);
            position: relative;
            overflow: hidden;
        }
        .hero-bg::before {
            content: '';
            position: absolute;
            width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%);
            top: -100px; right: -100px;
            border-radius: 50%;
            animation: pulse-glow 4s ease-in-out infinite;
        }
        .hero-bg::after {
            content: '';
            position: absolute;
            width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(30,58,138,0.3) 0%, transparent 70%);
            bottom: -80px; left: -80px;
            border-radius: 50%;
            animation: pulse-glow 4s ease-in-out infinite reverse;
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }
        .grid-pattern {
            background-image:
                linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px);
            background-size: 50px 50px;
            position: absolute; inset: 0;
        }
        .float-anim { animation: float 3s ease-in-out infinite; }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        .feature-card {
            transition: all 0.3s ease;
            border: 1px solid #E2E8F0;
        }
        .feature-card:hover {
            transform: translateY(-6px);
            border-color: #06B6D4;
            box-shadow: 0 20px 40px rgba(6,182,212,0.12);
        }
        .btn-primary {
            background: #06B6D4; color: white;
            transition: all 0.2s ease;
            box-shadow: 0 4px 20px rgba(6,182,212,0.35);
        }
        .btn-primary:hover {
            background: #0891B2;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(6,182,212,0.45);
        }
        .btn-outline {
            border: 2px solid rgba(255,255,255,0.4);
            color: white; transition: all 0.2s ease;
            backdrop-filter: blur(4px);
        }
        .btn-outline:hover {
            background: rgba(255,255,255,0.1);
            border-color: white;
        }
        .navbar {
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .fade-up {
            opacity: 0; transform: translateY(30px);
            animation: fadeUp 0.8s ease forwards;
        }
        .fade-up:nth-child(1) { animation-delay: 0.1s; }
        .fade-up:nth-child(2) { animation-delay: 0.3s; }
        .fade-up:nth-child(3) { animation-delay: 0.5s; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .icon-ring {
            background: linear-gradient(135deg, #CFFAFE, #DBEAFE);
            border: 2px solid #06B6D4;
        }
        .footer-bg { background: #0f172a; }
    </style>
</head>
<body>

<nav class="navbar fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/90">
    <div class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

        <a href="/ddcet/" class="flex items-center gap-2">
            <span class="text-2xl">📖</span>
            <span class="brand font-bold text-xl tracking-tight">
                <span class="text-white">DDCET</span><span class="text-[#06B6D4]">PrepHub</span>
            </span>
        </a>

        <div class="flex items-center gap-3">
            <a href="/ddcet/login" class="text-slate-300 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                Login
            </a>
            <a href="/ddcet/register" class="btn-primary px-5 py-2 rounded-lg text-sm font-semibold">
                Get Started Free
            </a>
        </div>
    </div>
</nav>