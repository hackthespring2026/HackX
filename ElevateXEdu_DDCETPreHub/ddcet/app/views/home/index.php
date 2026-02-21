<?php include '../layouts/header.php'; ?>

<section class="hero-bg min-h-screen flex items-center justify-center relative pt-20">
    <div class="grid-pattern"></div>

    <div class="relative z-10 max-w-5xl mx-auto px-6 text-center py-20">

        <div class="fade-up inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm float-anim">
            <div class="w-2 h-2 bg-[#06B6D4] rounded-full animate-pulse"></div>
            <span class="text-[#CFFAFE] text-sm font-medium">Free Platform for DDCET Aspirants</span>
        </div>

        <h1 class="fade-up text-white text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Crack DDCET<br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#38BDF8]">
                With Confidence
            </span>
        </h1>

        <p class="fade-up text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The centralized preparation platform for Diploma to Degree students.
            Access structured materials, practice MCQs, and track your progress — all in one place.
        </p>

        <div class="fade-up flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/ddcet/register?role=student" class="btn-primary px-8 py-4 rounded-xl font-semibold text-base w-full sm:w-auto">
                🎓 Start Preparing — It's Free
            </a>
            <a href="/ddcet/register?role=faculty" class="btn-outline px-8 py-4 rounded-xl font-semibold text-base w-full sm:w-auto">
                👨‍🏫 Join as Faculty
            </a>
        </div>

        <div class="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div class="text-center">
                <div class="text-[#06B6D4] text-2xl font-bold brand">3500+</div>
                <div class="text-slate-400 text-xs mt-1">MCQ Questions</div>
            </div>
            <div class="text-center border-x border-white/10">
                <div class="text-[#06B6D4] text-2xl font-bold brand">All</div>
                <div class="text-slate-400 text-xs mt-1">Subjects</div>
            </div>
            <div class="text-center">
                <div class="text-[#06B6D4] text-2xl font-bold brand">100%</div>
                <div class="text-slate-400 text-xs mt-1">Free Access</div>
            </div>
        </div>

    </div>

    <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 40C1200 80 900 0 720 20C540 40 240 80 0 40L0 80Z" fill="#F8FAFC"/>
        </svg>
    </div>
</section>

<section class="py-24 px-6 bg-[#F8FAFC]">
    <div class="max-w-6xl mx-auto">

        <div class="text-center mb-16">
            <span class="text-[#06B6D4] text-sm font-semibold uppercase tracking-widest">What We Offer</span>
            <h2 class="text-[#0F172A] text-4xl md:text-5xl font-extrabold mt-3 brand">
                Everything You Need<br/>
                <span class="text-[#1E3A8A]">To Prepare Smart</span>
            </h2>
            <p class="text-[#475569] text-lg mt-4 max-w-xl mx-auto">
                Designed specifically for DDCET aspirants who want a structured, focused preparation path.
            </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">

            <!-- Card 1 -->
            <div class="feature-card bg-white rounded-2xl p-8">
                <div class="icon-ring w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <svg class="w-7 h-7 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                </div>
                <h3 class="text-[#0F172A] text-xl font-bold mb-3 brand">Structured Study Material</h3>
                <p class="text-[#475569] leading-relaxed">
                    Subject-wise notes and resources uploaded by verified faculty. No more random searching — everything organized and ready.
                </p>
                <div class="mt-6 flex items-center gap-2 text-[#06B6D4] text-sm font-semibold">
                    <span>For Students</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </div>

            <div class="feature-card bg-white rounded-2xl p-8 relative overflow-hidden">
                <div class="absolute top-4 right-4 bg-[#1E3A8A] text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>
                <div class="icon-ring w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <svg class="w-7 h-7 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                </div>
                <h3 class="text-[#0F172A] text-xl font-bold mb-3 brand">MCQ Practice Tests</h3>
                <p class="text-[#475569] leading-relaxed">
                    500+ practice questions across all DDCET subjects. Attempt unlimited tests, review answers, and strengthen weak areas before exam day.
                </p>
                <div class="mt-6 flex items-center gap-2 text-[#06B6D4] text-sm font-semibold">
                    <span>Start Practicing</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </div>

            <div class="feature-card bg-white rounded-2xl p-8">
                <div class="icon-ring w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                    <svg class="w-7 h-7 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                </div>
                <h3 class="text-[#0F172A] text-xl font-bold mb-3 brand">Performance Analytics</h3>
                <p class="text-[#475569] leading-relaxed">
                    Track your scores, identify weak topics, and monitor your improvement over time. Data-driven preparation for serious aspirants.
                </p>
                <div class="mt-6 flex items-center gap-2 text-[#06B6D4] text-sm font-semibold">
                    <span>Track Progress</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </div>

        </div>

        <!-- Faculty CTA strip -->
        <div class="mt-12 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 class="text-white text-2xl font-bold brand">Are You a Faculty Member?</h3>
                <p class="text-blue-200 mt-1">Join as a verified faculty and help DDCET students succeed.</p>
            </div>
            <a href="/ddcet/register?role=faculty" class="bg-white text-[#1E3A8A] px-7 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all whitespace-nowrap flex-shrink-0">
                Register as Faculty →
            </a>
        </div>

    </div>
</section>

<?php include '../layouts/footer.php'; ?>