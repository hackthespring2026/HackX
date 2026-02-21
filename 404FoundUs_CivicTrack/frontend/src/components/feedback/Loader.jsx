import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8fafc]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 border-[3px] border-slate-200 border-t-blue-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.1)]"
                    />

                    <motion.div
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 m-auto w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"
                    >
                        <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
                    </motion.div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Initialising Terminal</p>
            </div>
        </div>
    );
};

export default Loader;
